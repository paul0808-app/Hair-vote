import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Supabase の無料プランは、1週間ほどアクセスが無いとプロジェクトが
 * 自動的に一時停止する。1日1回ここを呼び出して軽く読み取りを行い、
 * 「使われている」状態を保つ。
 *
 * 呼び出しは Vercel の定期実行（vercel.json の crons）から行われる。
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel は定期実行時に CRON_SECRET を付けて呼び出す。
  // 設定してある場合は、それが一致するときだけ実行する。
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "データベースに接続されていません" },
      { status: 200 },
    );
  }

  // いちばん軽い読み取り。行の中身は取らず、件数だけ数える
  const { count, error } = await supabase
    .from("styles")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[keep-alive] 失敗:", error.message);
    return NextResponse.json({ ok: false, reason: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true, styles: count ?? 0, at: new Date().toISOString() });
}
