"use server";

import { parseSalonCode } from "@/lib/salons";
import { getSupabase } from "@/lib/supabase";
import { MAX_SELECTION } from "@/lib/types";

export type SubmitResult =
  | { ok: true; ballotId: string | null; saved: boolean }
  | { ok: false; message: string };

type SubmitInput = {
  sessionId: string;
  seat: string | null;
  salon: string | null;
  styleIds: string[];
};

/**
 * 投票を確定してデータベースに保存する。
 *
 * 同時接続対策の肝：いいねを押すたびではなく、この確定の1回だけ書き込む。
 * さらに保存はデータベース側の関数 submit_ballot で「1つのトランザクション」として
 * まとめて行うので、途中で失敗しても中途半端なデータが残らない。
 */
export async function submitVote(input: SubmitInput): Promise<SubmitResult> {
  const { sessionId, seat, salon, styleIds } = input;

  // 画面側の制御を信用せず、サーバー側でも必ず検証する
  if (!sessionId || typeof sessionId !== "string") {
    return { ok: false, message: "セッションが正しくありません" };
  }
  if (!Array.isArray(styleIds) || styleIds.length === 0) {
    return { ok: false, message: "写真が選ばれていません" };
  }
  if (styleIds.length > MAX_SELECTION) {
    return { ok: false, message: `選べるのは最大${MAX_SELECTION}枚までです` };
  }
  if (new Set(styleIds).size !== styleIds.length) {
    return { ok: false, message: "同じ写真が重複して選ばれています" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    // まだ Supabase に接続していない段階でも、画面の流れは止めない
    console.warn("[submitVote] Supabase 未接続のため保存をスキップしました");
    return { ok: true, ballotId: null, saved: false };
  }

  const { data, error } = await supabase.rpc("submit_ballot", {
    p_session_id: sessionId,
    p_seat: seat,
    // 画面から送られてきた店舗名も、決められた店舗コードかどうか確かめる
    p_salon: parseSalonCode(salon),
    p_style_ids: styleIds,
  });

  if (error) {
    console.error("[submitVote] 保存に失敗しました:", error.message);
    return { ok: false, message: "保存できませんでした。もう一度お試しください" };
  }

  return { ok: true, ballotId: (data as string | null) ?? null, saved: true };
}
