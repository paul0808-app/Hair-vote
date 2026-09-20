"use server";

import { revalidatePath } from "next/cache";
import { RESET_KEY } from "@/lib/admin";
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

/** 選ばれたスタイリストの名前を、名簿から引く。選ばれていなければ null */
async function stylistName(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  stylistId: string | null,
): Promise<string | null> {
  if (!stylistId) return null;
  const { data } = await supabase
    .from("stylists")
    .select("name")
    .eq("id", stylistId)
    .maybeSingle();
  return (data as { name?: string } | null)?.name ?? null;
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

  const stylistId = text(form, "stylist_id");
  const { error } = await supabase.from("styles").insert({
    image_url: uploadedFull.url,
    thumb_url: thumbUrl,
    title,
    stylist_id: stylistId,
    // 表示や書き出しをかんたんにするため、名前も一緒に持たせておく
    stylist: await stylistName(supabase, stylistId),
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

  const editStylistId = text(form, "stylist_id");
  const { error } = await supabase
    .from("styles")
    .update({
      title,
      stylist_id: editStylistId,
      stylist: await stylistName(supabase, editStylistId),
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

/**
 * 集計をリセットする（投票数・いいね数・ランキングを0に戻す）。
 *
 * 投票データそのものは消さず、「ここから先を数える」という開始点を記録するだけ。
 * 押し間違えても undoResetAction で元に戻せる。
 */
export async function resetCountsAction(key: string): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: RESET_KEY, value: now, updated_at: now }, { onConflict: "key" });

  if (error) {
    console.error("[admin] リセットに失敗:", error.message);
    return { ok: false, message: `リセットできませんでした（${error.message}）` };
  }

  return { ok: true, message: "集計をリセットしました" };
}

/** 直前のリセットを取り消して、これまでの集計に戻す */
export async function undoResetAction(key: string): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { error } = await supabase.from("app_settings").delete().eq("key", RESET_KEY);
  if (error) {
    console.error("[admin] リセットの取り消しに失敗:", error.message);
    return { ok: false, message: `取り消せませんでした（${error.message}）` };
  }

  return { ok: true, message: "リセットを取り消しました" };
}

/** 最初から入っているサンプル写真かどうかの目印（配信元のアドレス） */
const SAMPLE_IMAGE_HOST = "picsum.photos";

/**
 * サンプル写真をまとめて投票画面から隠す。
 * サンプルは外部の無料サービスから配信されていて表示が遅いため、
 * 実際の写真が揃ったら一度に片付けられるようにしておく。
 */
export async function hideSampleStylesAction(key: string): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { data, error } = await supabase
    .from("styles")
    .update({ is_active: false })
    .like("image_url", `%${SAMPLE_IMAGE_HOST}%`)
    .eq("is_active", true)
    .select("id");

  if (error) {
    console.error("[admin] サンプル写真の非表示に失敗:", error.message);
    return { ok: false, message: `変更できませんでした（${error.message}）` };
  }

  const count = (data as unknown[] | null)?.length ?? 0;
  revalidatePath("/");
  return {
    ok: true,
    message:
      count === 0
        ? "非表示にできるサンプル写真はありませんでした"
        : `サンプル写真 ${count} 枚を投票画面から隠しました`,
  };
}

/**
 * 登録済みの写真の並び順をランダムに入れ替える。
 * 押すたびに違う並びになる。
 *
 * データベース側の関数は使わず、アプリ側で新しい順番を決めて書き込んでいる。
 * 並び順は万一途中で失敗しても作り直せる情報なので、この方法で十分。
 */
export async function shuffleStylesAction(key: string): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { data, error } = await supabase.from("styles").select("id");
  if (error) {
    console.error("[admin] 並び替えの準備に失敗:", error.message);
    return { ok: false, message: `並び替えできませんでした（${error.message}）` };
  }

  const ids = ((data as Array<{ id: string }> | null) ?? []).map((row) => row.id);
  if (ids.length < 2) {
    return { ok: false, message: "並び替えるには写真が2枚以上必要です" };
  }

  // 後ろから1つずつ、ランダムに選んだ要素と入れ替えていく（偏りのない混ぜ方）
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase.from("styles").update({ display_order: index + 1 }).eq("id", id),
    ),
  );

  const failed = results.filter((r) => r.error).length;
  if (failed > 0) {
    console.error("[admin] 並び替えの一部に失敗:", results.find((r) => r.error)?.error?.message);
    return {
      ok: false,
      message: `${failed}件の並び替えに失敗しました。もう一度お試しください`,
    };
  }

  revalidatePath("/");
  return { ok: true, message: `${ids.length}枚の並び順をランダムにしました` };
}

// =====================================================================
// スタイリスト名簿
// =====================================================================

/**
 * スタイリストを名簿に追加する。
 * 出品しないスタッフも登録しておくと、店舗賞の「1人あたり」の分母に含まれる。
 */
export async function createStylistAction(form: FormData): Promise<ActionResult> {
  const key = String(form.get("key") ?? "");
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const name = text(form, "name");
  if (!name) return { ok: false, message: "名前を入力してください" };

  const { error } = await supabase.from("stylists").insert({
    name,
    salon: parseSalonCode(text(form, "salon")),
    is_active: true,
  });

  if (error) {
    console.error("[admin] スタイリストの追加に失敗:", error.message);
    // 同じ名前がすでにある場合は、分かりやすい言葉で伝える
    const message = error.message.includes("stylists_name_idx")
      ? `「${name}」はすでに名簿にあります`
      : `追加できませんでした（${error.message}）`;
    return { ok: false, message };
  }

  revalidatePath("/");
  return { ok: true, message: `「${name}」を名簿に追加しました` };
}

/** スタイリストの名前や所属店舗を直す */
export async function updateStylistAction(form: FormData): Promise<ActionResult> {
  const key = String(form.get("key") ?? "");
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const id = text(form, "id");
  const name = text(form, "name");
  if (!id) return { ok: false, message: "対象が指定されていません" };
  if (!name) return { ok: false, message: "名前を入力してください" };

  const { error } = await supabase
    .from("stylists")
    .update({ name, salon: parseSalonCode(text(form, "salon")) })
    .eq("id", id);

  if (error) {
    console.error("[admin] スタイリストの更新に失敗:", error.message);
    return { ok: false, message: `保存できませんでした（${error.message}）` };
  }

  // 写真側に持っている担当者名の表示も合わせて直す
  await supabase.from("styles").update({ stylist: name }).eq("stylist_id", id);

  revalidatePath("/");
  return { ok: true, message: "保存しました" };
}

/**
 * 在籍・休止を切り替える。
 * 休止にすると、写真の担当者の選択肢から外れ、店舗賞の分母にも入らなくなる。
 * すでに登録済みの写真と、これまでの得票はそのまま残る。
 */
export async function toggleStylistActiveAction(
  key: string,
  id: string,
  nextActive: boolean,
): Promise<ActionResult> {
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const { error } = await supabase.from("stylists").update({ is_active: nextActive }).eq("id", id);
  if (error) {
    console.error("[admin] 在籍状態の変更に失敗:", error.message);
    return { ok: false, message: `変更できませんでした（${error.message}）` };
  }

  return { ok: true, message: nextActive ? "在籍にもどしました" : "休止にしました" };
}

/** 一度にまとめて登録できる人数の上限 */
const MAX_BULK_STYLISTS = 200;

/**
 * スタイリストをまとめて名簿に登録する。
 * 1行に1人ずつ書いた名前を受け取り、すでにいる人は飛ばして追加する。
 */
export async function createStylistsBulkAction(form: FormData): Promise<ActionResult> {
  const key = String(form.get("key") ?? "");
  const denied = guard(key);
  if (denied) return denied;

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "データベースに接続されていません" };

  const raw = form.get("names");
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, message: "名前を1行に1人ずつ入力してください" };
  }

  // 前後の空白だけ取り除き、名前そのもの（姓と名の間の空白など）はそのまま残す
  const names = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (names.length === 0) {
    return { ok: false, message: "名前を1行に1人ずつ入力してください" };
  }
  if (names.length > MAX_BULK_STYLISTS) {
    return { ok: false, message: `一度に登録できるのは${MAX_BULK_STYLISTS}人までです` };
  }

  // 入力の中での重複を先にまとめる
  const unique = [...new Set(names)];
  const salon = parseSalonCode(text(form, "salon"));

  const { data: existingRows, error: readError } = await supabase.from("stylists").select("name");
  if (readError) {
    console.error("[admin] 名簿の読み取りに失敗:", readError.message);
    return { ok: false, message: `登録できませんでした（${readError.message}）` };
  }

  const existing = new Set(
    ((existingRows as Array<{ name: string }> | null) ?? []).map((row) => row.name),
  );
  const toInsert = unique.filter((name) => !existing.has(name));
  const skipped = unique.length - toInsert.length;

  if (toInsert.length === 0) {
    return { ok: false, message: `${skipped}人とも、すでに名簿にありました` };
  }

  const { error } = await supabase
    .from("stylists")
    .insert(toInsert.map((name) => ({ name, salon, is_active: true })));

  if (error) {
    console.error("[admin] まとめて登録に失敗:", error.message);
    return { ok: false, message: `登録できませんでした（${error.message}）` };
  }

  revalidatePath("/");
  return {
    ok: true,
    message:
      skipped > 0
        ? `${toInsert.length}人を追加しました（${skipped}人はすでに登録済み）`
        : `${toInsert.length}人を名簿に追加しました`,
  };
}
