import "server-only";
import { getSupabase } from "./supabase";
import type {
  AdminData,
  AdminStyle,
  Range,
  RankingRow,
  SalonKey,
  Summary,
} from "./admin-shared";

// 型やラベル、期間の計算は画面側からも使うので admin-shared に置いてある
export * from "./admin-shared";

const EMPTY_SUMMARY: Summary = { totalBallots: 0, totalVotes: 0, avgVotes: 0 };

/** 管理画面のランキングとサマリーを取得する。常に最新を読む */
export async function getAdminData(range: Range, salon: SalonKey): Promise<AdminData> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ranking: [], summary: EMPTY_SUMMARY, error: "データベースに接続されていません" };
  }

  const params = {
    p_from: range.from,
    p_to: range.to,
    p_salon: salon === "all" ? null : salon,
  };

  const [rankingRes, summaryRes] = await Promise.all([
    supabase.rpc("admin_ranking", params),
    supabase.rpc("admin_summary", params),
  ]);

  if (rankingRes.error || summaryRes.error) {
    const message = rankingRes.error?.message ?? summaryRes.error?.message ?? "";
    console.error("[admin] 集計の取得に失敗:", message);
    return {
      ranking: [],
      summary: EMPTY_SUMMARY,
      error: `集計を取得できませんでした（${message}）`,
    };
  }

  const summaryRow = (summaryRes.data as Array<Record<string, unknown>> | null)?.[0];
  const summary: Summary = summaryRow
    ? {
        totalBallots: Number(summaryRow.total_ballots ?? 0),
        totalVotes: Number(summaryRow.total_votes ?? 0),
        avgVotes: Number(summaryRow.avg_votes ?? 0),
      }
    : EMPTY_SUMMARY;

  const ranking: RankingRow[] = (
    (rankingRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((row) => {
    const votes = Number(row.votes ?? 0);
    return {
      styleId: String(row.style_id),
      title: String(row.title ?? ""),
      stylist: (row.stylist as string | null) ?? null,
      thumbUrl: (row.thumb_url as string | null) ?? null,
      imageUrl: String(row.image_url ?? ""),
      salon: (row.salon as string | null) ?? null,
      isActive: Boolean(row.is_active),
      votes,
      sharePercent:
        summary.totalBallots === 0
          ? 0
          : Math.round((votes / summary.totalBallots) * 1000) / 10,
    };
  });

  return { ranking, summary, error: null };
}

/** 写真の管理用に、非表示のものも含めて全件取得する */
export async function getAllStyles(): Promise<{ styles: AdminStyle[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { styles: [], error: "データベースに接続されていません" };

  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[admin] スタイル一覧の取得に失敗:", error.message);
    return { styles: [], error: `一覧を取得できませんでした（${error.message}）` };
  }

  const styles: AdminStyle[] = ((data as Array<Record<string, unknown>> | null) ?? []).map(
    (row) => ({
      id: String(row.id),
      imageUrl: String(row.image_url ?? ""),
      thumbUrl: (row.thumb_url as string | null) ?? null,
      title: String(row.title ?? ""),
      stylist: (row.stylist as string | null) ?? null,
      caption: (row.caption as string | null) ?? null,
      tags: (row.tags as string[] | null) ?? null,
      salon: (row.salon as string | null) ?? null,
      displayOrder: Number(row.display_order ?? 0),
      isActive: Boolean(row.is_active),
    }),
  );

  return { styles, error: null };
}
