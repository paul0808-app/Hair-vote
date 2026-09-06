import Link from "next/link";
import {
  PERIOD_LABELS,
  SALON_FILTER_KEYS,
  SALON_FILTER_LABELS,
  type PeriodKey,
  type SalonKey,
} from "@/lib/admin-shared";

type Props = {
  adminKey: string;
  period: PeriodKey;
  salon: SalonKey;
  from: string;
  to: string;
};

function chipClass(active: boolean): string {
  return [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    active ? "bg-accent text-white shadow-sm" : "bg-white text-black/60 ring-1 ring-black/10",
  ].join(" ");
}

/** 期間と店舗の絞り込み。リンクを踏むだけで切り替わる（保存操作は不要） */
export function Filters({ adminKey, period, salon, from, to }: Props) {
  const link = (next: { period?: PeriodKey; salon?: SalonKey }) => {
    const params = new URLSearchParams({
      key: adminKey,
      period: next.period ?? period,
      salon: next.salon ?? salon,
    });
    if ((next.period ?? period) === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    return `/admin?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-black/45">期間</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => (
            <Link key={p} href={link({ period: p })} className={chipClass(p === period)}>
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {period === "custom" && (
        // ページを読み込み直すだけの、いちばん単純な形にしている
        <form method="get" action="/admin" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="key" value={adminKey} />
          <input type="hidden" name="period" value="custom" />
          <input type="hidden" name="salon" value={salon} />
          <label className="text-xs text-black/45">
            開始日
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 block rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-xs text-black/45">
            終了日
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 block rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            この期間で見る
          </button>
        </form>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-black/45">店舗</p>
        <div className="flex flex-wrap gap-2">
          {SALON_FILTER_KEYS.map((s) => (
            <Link key={s} href={link({ salon: s })} className={chipClass(s === salon)}>
              {SALON_FILTER_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
