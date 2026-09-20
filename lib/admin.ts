import "server-only";
import { getSupabase } from "./supabase";
import type {
  AdminData,
  AdminStyle,
  AdminStylist,
  Range,
  RankingRow,
  SalonAwardRow,
  SalonKey,
  StylistRankingRow,
  Summary,
} from "./admin-shared";

// 型やラベル、期間の計算は画面側からも使うので admin-shared に置いてある
export * from "./admin-shared";

const EMPTY_SUMMARY: Summary = { totalBallots: 0, totalVotes: 0, avgVotes: 0 };

/** 集計のリセット日時を保存しておく名前 */
export const RESET_KEY = "ranking_reset_at";

/**
 * 最後に集計をリセットした日時。まだ一度もリセットしていなければ null。
 * 投票データは消していないので、この日時を消せば元の集計に戻る。
 */
export async function getResetAt(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", RESET_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin] リセット日時の取得に失敗:", error.message);
    return null;
  }
  const value = (data as { value?: string } | null)?.value;
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * リセット日時より前は数えないよう、集計する期間の開始点を引き上げる。
 * 「日付を指定」で過去を選んだ場合も、リセット後だけが対象になる。
 */
export function applyResetFloor(range: Range, resetAt: string | null): Range {
  if (!resetAt) return range;
  const floor = Date.parse(resetAt);
  if (Number.isNaN(floor)) return range;
  const from = range.from ? Math.max(Date.parse(range.from), floor) : floor;
  return { ...range, from: new Date(from).toISOString() };
}

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
      stylistId: (row.stylist_id as string | null) ?? null,
      caption: (row.caption as string | null) ?? null,
      tags: (row.tags as string[] | null) ?? null,
      salon: (row.salon as string | null) ?? null,
      displayOrder: Number(row.display_order ?? 0),
      isActive: Boolean(row.is_active),
    }),
  );

  return { styles, error: null };
}

/** 表彰2：スタイリスト別ランキング（合計いいね数の多い順） */
export async function getStylistRanking(
  range: Range,
  salon: SalonKey,
): Promise<{ rows: StylistRankingRow[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: "データベースに接続されていません" };

  const { data, error } = await supabase.rpc("admin_stylist_ranking", {
    p_from: range.from,
    p_to: range.to,
    // ここでの店舗は「スタイリストの所属店舗」で絞り込む
    p_salon: salon === "all" ? null : salon,
  });

  if (error) {
    console.error("[admin] スタイリスト別の集計に失敗:", error.message);
    return { rows: [], error: `スタイリスト別の集計を取得できませんでした（${error.message}）` };
  }

  const rows: StylistRankingRow[] = ((data as Array<Record<string, unknown>> | null) ?? []).map(
    (row) => ({
      stylistId: String(row.stylist_id),
      name: String(row.name ?? ""),
      salon: (row.salon as string | null) ?? null,
      styleCount: Number(row.style_count ?? 0),
      votes: Number(row.votes ?? 0),
    }),
  );
  return { rows, error: null };
}

/** 表彰3：店舗賞（合計いいね数 ÷ 所属スタッフ数） */
export async function getSalonAward(
  range: Range,
): Promise<{ rows: SalonAwardRow[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: "データベースに接続されていません" };

  const { data, error } = await supabase.rpc("admin_salon_ranking", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    console.error("[admin] 店舗賞の集計に失敗:", error.message);
    return { rows: [], error: `店舗賞の集計を取得できませんでした（${error.message}）` };
  }

  const rows: SalonAwardRow[] = ((data as Array<Record<string, unknown>> | null) ?? []).map(
    (row) => ({
      salon: String(row.salon ?? ""),
      stylistCount: Number(row.stylist_count ?? 0),
      votes: Number(row.votes ?? 0),
      votesPerStylist: Number(row.votes_per_stylist ?? 0),
    }),
  );
  return { rows, error: null };
}

/** スタイリスト名簿を、休止中の人も含めて全件取得する */
export async function getAllStylists(): Promise<{
  stylists: AdminStylist[];
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) return { stylists: [], error: "データベースに接続されていません" };

  const { data, error } = await supabase
    .from("stylists")
    .select("*")
    .order("salon", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[admin] スタイリスト名簿の取得に失敗:", error.message);
    return { stylists: [], error: `名簿を取得できませんでした（${error.message}）` };
  }

  const stylists: AdminStylist[] = ((data as Array<Record<string, unknown>> | null) ?? []).map(
    (row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      salon: (row.salon as string | null) ?? null,
      displayOrder: Number(row.display_order ?? 0),
      isActive: Boolean(row.is_active),
    }),
  );
  return { stylists, error: null };
}
