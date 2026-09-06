/**
 * 管理画面のうち、画面側（ブラウザ）からも使う型と定数。
 * データベースに触る処理は lib/admin.ts に分けてある。
 */

import { SALON_CODES, SALON_LABELS, type SalonCode } from "./salons";

export { salonLabel } from "./salons";

/** 日本時間は UTC より9時間進んでいる（サマータイムなし） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type PeriodKey = "today" | "7d" | "month" | "all" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "今日",
  "7d": "直近7日",
  month: "今月",
  all: "全期間",
  custom: "日付を指定",
};

/** 管理画面の絞り込みで使う店舗の指定。"all" は全店 */
export type SalonKey = "all" | SalonCode;

/** 絞り込みボタンに並べる順番 */
export const SALON_FILTER_KEYS: SalonKey[] = ["all", ...SALON_CODES];

export const SALON_FILTER_LABELS: Record<SalonKey, string> = {
  all: "全店",
  ...SALON_LABELS,
};

/** 日本時間の「その日の0時」を求める */
function jstMidnight(base: Date, dayOffset = 0): Date {
  const jst = new Date(base.getTime() + JST_OFFSET_MS);
  jst.setUTCHours(0, 0, 0, 0);
  jst.setUTCDate(jst.getUTCDate() + dayOffset);
  return new Date(jst.getTime() - JST_OFFSET_MS);
}

/** 「2026-09-06」のような文字列を、日本時間のその日の0時として読む */
function parseJstDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}T00:00:00+09:00`);
  return Number.isNaN(t) ? null : new Date(t);
}

export type Range = {
  /** この時刻以降（含む）。null なら制限なし */
  from: string | null;
  /** この時刻より前（含まない）。null なら制限なし */
  to: string | null;
  label: string;
};

/** 選ばれた期間を、実際の日時の範囲に変換する */
export function resolveRange(period: PeriodKey, from?: string, to?: string): Range {
  const now = new Date();

  switch (period) {
    case "today": {
      const start = jstMidnight(now);
      return { from: start.toISOString(), to: null, label: "今日" };
    }
    case "7d": {
      // 今日を含む7日間
      const start = jstMidnight(now, -6);
      return { from: start.toISOString(), to: null, label: "直近7日" };
    }
    case "month": {
      const jst = new Date(now.getTime() + JST_OFFSET_MS);
      const start = new Date(
        Date.parse(
          `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00+09:00`,
        ),
      );
      return { from: start.toISOString(), to: null, label: "今月" };
    }
    case "custom": {
      const start = parseJstDate(from ?? null);
      const endDay = parseJstDate(to ?? null);
      // 終了日は「その日の終わりまで」を含めたいので、翌日の0時を上限にする
      const end = endDay ? new Date(endDay.getTime() + 24 * 60 * 60 * 1000) : null;
      const label =
        start || endDay ? `${from ?? "最初"} 〜 ${to ?? "最新"}` : "全期間";
      return {
        from: start ? start.toISOString() : null,
        to: end ? end.toISOString() : null,
        label,
      };
    }
    default:
      return { from: null, to: null, label: "全期間" };
  }
}

export type RankingRow = {
  styleId: string;
  title: string;
  stylist: string | null;
  thumbUrl: string | null;
  imageUrl: string;
  salon: string | null;
  isActive: boolean;
  votes: number;
  /** 投票したお客様のうち、このスタイルを選んだ人の割合（%） */
  sharePercent: number;
};

export type Summary = {
  totalBallots: number;
  totalVotes: number;
  avgVotes: number;
};

export type AdminData = {
  ranking: RankingRow[];
  summary: Summary;
  error: string | null;
};

/** 管理画面で扱う、1件のスタイル（非表示のものも含む） */
export type AdminStyle = {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  title: string;
  stylist: string | null;
  caption: string | null;
  tags: string[] | null;
  salon: string | null;
  displayOrder: number;
  isActive: boolean;
};

