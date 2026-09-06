"use server";

import { revalidatePath } from "next/cache";
import { checkAdminKey } from "@/lib/admin-auth";
import { parseSalonCode } from "@/lib/salons";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "style-photos";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

/** アップロードできる写真の形式と大きさの上限 */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * すべての管理操作の入口で合言葉を確かめる。
 * これらの処理はインターネットから直接呼び出せるため、
 * 画面を開くときだけでなく、操作するたびに毎回確認する必要がある。
 */
function guard(key: string): ActionResult | null {
  const access = checkAdminKey(key);
  if (access === "ok") return null;
  return {
    ok: false,
    message:
      access === "not-configured"
        ? "管理用の合言葉（ADMIN_KEY）が設定されていません"
        : "合言葉が違います",
  };
}

async function uploadImage(
  file: File,
  folder: "full" | "thumb",
): Promise<{ url: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "データベースに接続されていません" };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `対応していない画像形式です（${file.type || "不明"}）` };
  }
  if (file.size > MAX_BYTES) {
    return { error: "画像が大きすぎます（8MBまで）" };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error("[admin] 画像のアップロードに失敗:", error.message);
    return { error: `画像を保存できませんでした（${error.message}）` };
  }

  return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** 入力欄の文字列を整える。空欄は null にする */
function text(form: FormData, name: string): string | null {
  const value = form.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** 「#ボブ ロング,カラー」のような入力をタグの配列にする */
function parseTags(raw: string | null): string[] | null {
  if (!raw) return null;
  const tags = raw
    .split(/[,、\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter((t) => t !== "");
  return tags.length > 0 ? tags : null;
}



/** 写真を新しく登録する */
export async function createStyleAction(form: FormData): Promise<ActionResult> {
  const key = String(form.get("key") ?? "");
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const title = text(form, "title");
  if (!title) return { ok: false, message: "スタイル名を入力してください" };

  const full = form.get("image");
  const thumb = form.get("thumb");
  if (!(full instanceof File) || full.size === 0) {
    return { ok: false, message: "写真を選んでください" };
  }

  const uploadedFull = await uploadImage(full, "full");
  if ("error" in uploadedFull) return { ok: false, message: uploadedFull.error };

  let thumbUrl: string | null = null;
  if (thumb instanceof File && thumb.size > 0) {
    const uploadedThumb = await uploadImage(thumb, "thumb");
    if ("error" in uploadedThumb) return { ok: false, message: uploadedThumb.error };
    thumbUrl = uploadedThumb.url;
  }

  // 新しい写真は一覧のいちばん後ろに並べる
  const { data: last } = await supabase
    .from("styles")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = Number(last?.[0]?.display_order ?? 0) + 1;

  const { error } = await supabase.from("styles").insert({
    image_url: uploadedFull.url,
    thumb_url: thumbUrl,
    title,
    stylist: text(form, "stylist"),
    caption: text(form, "caption"),
    tags: parseTags(text(form, "tags")),
    salon: parseSalonCode(text(form, "salon")),
    display_order: nextOrder,
    is_active: true,
  });

  if (error) {
    console.error("[admin] スタイルの登録に失敗:", error.message);
    return { ok: false, message: `登録できませんでした（${error.message}）` };
  }

  revalidatePath("/");
  return { ok: true, message: `「${title}」を登録しました` };
}

/** キャプションなどを編集する */
export async function updateStyleAction(form: FormData): Promise<ActionResult> {
  const key = String(form.get("key") ?? "");
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const id = text(form, "id");
  const title = text(form, "title");
  if (!id) return { ok: false, message: "対象が指定されていません" };
  if (!title) return { ok: false, message: "スタイル名を入力してください" };

  const { error } = await supabase
    .from("styles")
    .update({
      title,
      stylist: text(form, "stylist"),
      caption: text(form, "caption"),
      tags: parseTags(text(form, "tags")),
      salon: parseSalonCode(text(form, "salon")),
    })
    .eq("id", id);

  if (error) {
    console.error("[admin] スタイルの更新に失敗:", error.message);
    return { ok: false, message: `保存できませんでした（${error.message}）` };
  }

  revalidatePath("/");
  return { ok: true, message: "保存しました" };
}

/** 表示・非表示（アーカイブ）を切り替える */
export async function toggleActiveAction(
  key: string,
  id: string,
  nextActive: boolean,
): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { error } = await supabase.from("styles").update({ is_active: nextActive }).eq("id", id);
  if (error) {
    console.error("[admin] 表示状態の変更に失敗:", error.message);
    return { ok: false, message: `変更できませんでした（${error.message}）` };
  }

  revalidatePath("/");
  return { ok: true, message: nextActive ? "投票画面に表示しました" : "投票画面から隠しました" };
}

/** 表示順を、隣のスタイルと入れ替える */
export async function moveStyleAction(
  key: string,
  id: string,
  otherId: string,
): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { error } = await supabase.rpc("admin_swap_display_order", { p_a: id, p_b: otherId });
  if (error) {
    console.error("[admin] 並び替えに失敗:", error.message);
    return { ok: false, message: `並び替えできませんでした（${error.message}）` };
  }

  revalidatePath("/");
  return { ok: true, message: "並び順を変更しました" };
}
