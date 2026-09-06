import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/admin-auth";
import {
  PERIOD_LABELS,
  SALON_FILTER_KEYS,
  SALON_FILTER_LABELS,
  getAdminData,
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

  const range = resolveRange(
    period,
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );
  const { ranking, summary, error } = await getAdminData(range, salon);

  if (error) return new NextResponse(error, { status: 500 });

  const lines: string[] = [];
  lines.push(["集計期間", range.label].map(cell).join(","));
  lines.push(["店舗", SALON_FILTER_LABELS[salon]].map(cell).join(","));
  lines.push(["総投票数(人)", summary.totalBallots].map(cell).join(","));
  lines.push(["総いいね数", summary.totalVotes].map(cell).join(","));
  lines.push(["平均選択枚数", summary.avgVotes].map(cell).join(","));
  lines.push("");
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
