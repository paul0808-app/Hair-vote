import type { Summary } from "@/lib/admin-shared";

/** 総投票数・総いいね数・平均選択枚数の3枚のカード */
export function SummaryCards({ summary, rangeLabel }: { summary: Summary; rangeLabel: string }) {
  const items = [
    { label: "総投票数", value: summary.totalBallots, unit: "人", hint: "投票したお客様の人数" },
    { label: "総いいね数", value: summary.totalVotes, unit: "件", hint: "選ばれた写真の延べ数" },
    { label: "平均選択枚数", value: summary.avgVotes, unit: "枚", hint: "お客様1人あたり" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-black/45">{rangeLabel}の集計</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white p-3 ring-1 ring-black/5 sm:p-5"
          >
            <p className="text-xs text-black/50 sm:text-sm">{item.label}</p>
            <p className="mt-1 font-bold tabular-nums">
              <span className="text-2xl sm:text-4xl">{item.value}</span>
              <span className="ml-1 text-sm text-black/45 sm:text-base">{item.unit}</span>
            </p>
            <p className="mt-1 text-[11px] leading-tight text-black/35 sm:text-xs">{item.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
