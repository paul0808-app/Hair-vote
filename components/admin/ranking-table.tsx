import { Thumb } from "../thumb";
import { SALON_LABELS, type RankingRow, type SalonKey } from "@/lib/admin-shared";

/** 同じ得票数なら同じ順位にする（1,2,2,4 のような付け方） */
function withRanks(rows: RankingRow[]): Array<RankingRow & { rank: number }> {
  let lastVotes: number | null = null;
  let lastRank = 0;
  return rows.map((row, index) => {
    const rank = row.votes === lastVotes ? lastRank : index + 1;
    lastVotes = row.votes;
    lastRank = rank;
    return { ...row, rank };
  });
}

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 ring-1 ring-black/5">
        この条件では、まだ投票がありません。
      </p>
    );
  }

  const ranked = withRanks(rows);
  const maxVotes = Math.max(...ranked.map((r) => r.votes), 1);

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/8 text-left text-xs text-black/45">
            <th className="px-3 py-3 font-medium">順位</th>
            <th className="px-2 py-3 font-medium">写真</th>
            <th className="px-2 py-3 font-medium">スタイル名</th>
            <th className="px-2 py-3 font-medium">スタイリスト</th>
            <th className="px-2 py-3 text-right font-medium">得票数</th>
            <th className="px-3 py-3 font-medium">得票率</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.styleId} className="border-b border-black/5 last:border-0">
              <td className="px-3 py-2.5 text-base font-bold tabular-nums text-black/70">
                {row.votes > 0 ? row.rank : "—"}
              </td>
              <td className="px-2 py-2.5">
                <div className="h-12 w-12 overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/5">
                  <Thumb
                    style={{ title: row.title, imageUrl: row.imageUrl, thumbUrl: row.thumbUrl }}
                  />
                </div>
              </td>
              <td className="px-2 py-2.5">
                <span className="font-medium">{row.title}</span>
                {!row.isActive && (
                  <span className="ml-1.5 rounded bg-black/8 px-1.5 py-0.5 text-[10px] text-black/50">
                    非表示
                  </span>
                )}
                {row.salon && (
                  <span className="ml-1.5 text-[11px] text-black/40">
                    {SALON_LABELS[row.salon as SalonKey] ?? row.salon}
                  </span>
                )}
              </td>
              <td className="px-2 py-2.5 text-black/60">{row.stylist ?? "—"}</td>
              <td className="px-2 py-2.5 text-right text-base font-bold tabular-nums">
                {row.votes}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-black/8 sm:w-24">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(row.votes / maxVotes) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-black/50">{row.sharePercent}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-black/5 px-3 py-2.5 text-[11px] text-black/40">
        得票率＝投票したお客様のうち、そのスタイルを選んだ人の割合
      </p>
    </div>
  );
}
