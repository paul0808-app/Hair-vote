import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/admin-auth";
import {
  PERIOD_LABELS,
  SALON_FILTER_KEYS,
  SALON_FILTER_LABELS,
  applyResetFloor,
  getAdminData,
  getResetAt,
  getSalonAward,
  getStylistRanking,
  resolveRange,
  salonLabel,
  type PeriodKey,
  type SalonKey,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

/** CSVの1マスぶんを、カンマや改行が入っていても壊れない形にする */
function cell(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (checkAdminKey(url.searchParams.get("key")) !== "ok") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const periodParam = url.searchParams.get("period") ?? "all";
  const period: PeriodKey = (["today", "7d", "month", "all", "custom"] as const).includes(
    periodParam as PeriodKey,
  )
    ? (periodParam as PeriodKey)
    : "all";

  const salonParam = url.searchParams.get("salon") ?? "all";
  const salon: SalonKey = SALON_FILTER_KEYS.includes(salonParam as SalonKey)
    ? (salonParam as SalonKey)
    : "all";

  const resetAt = await getResetAt();
  // 管理画面の表示と同じ期間になるよう、リセット日時より後だけを対象にする
  const range = applyResetFloor(
    resolveRange(
      period,
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined,
    ),
    resetAt,
  );
  const [{ ranking, summary, error }, stylistRanking, salonAward] = await Promise.all([
    getAdminData(range, salon),
    getStylistRanking(range, salon),
    getSalonAward(range),
  ]);

  if (error) return new NextResponse(error, { status: 500 });

  const lines: string[] = [];
  lines.push(["集計期間", range.label].map(cell).join(","));
  lines.push(["店舗", SALON_FILTER_LABELS[salon]].map(cell).join(","));
  lines.push(["総投票数(人)", summary.totalBallots].map(cell).join(","));
  lines.push(["総いいね数", summary.totalVotes].map(cell).join(","));
  lines.push(["平均選択枚数", summary.avgVotes].map(cell).join(","));
  if (resetAt) {
    lines.push(["最終リセット", new Date(resetAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })].map(cell).join(","));
  }
  lines.push("");
  lines.push(["【1】スタイル別（いいねが多い順）"].map(cell).join(","));
  lines.push(
    ["順位", "スタイル名", "スタイリスト", "店舗", "得票数", "得票率(%)", "投票画面での表示"]
      .map(cell)
      .join(","),
  );

  let lastVotes: number | null = null;
  let lastRank = 0;
  ranking.forEach((row: (typeof ranking)[number], index: number) => {
    const rank = row.votes === lastVotes ? lastRank : index + 1;
    lastVotes = row.votes;
    lastRank = rank;
    lines.push(
      [
        rank,
        row.title,
        row.stylist ?? "",
        salonLabel(row.salon),
        row.votes,
        row.sharePercent,
        row.isActive ? "表示中" : "非表示",
      ]
        .map(cell)
        .join(","),
    );
  });

  // --- 表彰2：スタイリスト別 ---
  lines.push("");
  lines.push(["【2】スタイリスト別（合計いいね数が多い順）"].map(cell).join(","));
  lines.push(["順位", "スタイリスト", "所属店舗", "出品数", "合計いいね"].map(cell).join(","));
  lastVotes = null;
  lastRank = 0;
  stylistRanking.rows.forEach((row, index) => {
    const rank = row.votes === lastVotes ? lastRank : index + 1;
    lastVotes = row.votes;
    lastRank = rank;
    lines.push(
      [rank, row.name, salonLabel(row.salon), row.styleCount, row.votes].map(cell).join(","),
    );
  });

  // --- 表彰3：店舗賞 ---
  lines.push("");
  lines.push(["【3】店舗賞（1人あたりのいいね数が多い順）"].map(cell).join(","));
  lines.push(["順位", "店舗", "合計いいね", "所属スタッフ数", "1人あたり"].map(cell).join(","));
  let lastPer: number | null = null;
  let lastPerRank = 0;
  salonAward.rows.forEach((row, index) => {
    const rank = row.votesPerStylist === lastPer ? lastPerRank : index + 1;
    lastPer = row.votesPerStylist;
    lastPerRank = rank;
    lines.push(
      [rank, salonLabel(row.salon), row.votes, row.stylistCount, row.votesPerStylist]
        .map(cell)
        .join(","),
    );
  });

  // 先頭のBOM。これが無いとExcelで開いたときに日本語が文字化けする
  const body = "﻿" + lines.join("\r\n") + "\r\n";

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `hairvote-ranking-${PERIOD_LABELS[period]}-${stamp}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // 日本語のファイル名は、対応している形式（filename*）でも渡す
      "Content-Disposition": `attachment; filename="hairvote-ranking-${stamp}.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
