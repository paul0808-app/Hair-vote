import { salonLabel } from "@/lib/salons";
import type { SalonAwardRow, StylistRankingRow } from "@/lib/admin-shared";

/** 同じ数字なら同じ順位にする（1,2,2,4 のような付け方） */
function withRanks<T extends { [K in keyof T]: T[K] }>(
  rows: T[],
  valueOf: (row: T) => number,
): Array<T & { rank: number }> {
  let lastValue: number | null = null;
  let lastRank = 0;
  return rows.map((row, index) => {
    const value = valueOf(row);
    const rank = value === lastValue ? lastRank : index + 1;
    lastValue = value;
    lastRank = rank;
    return { ...row, rank };
  });
}

const headCell = "px-3 py-3 text-left text-xs font-medium text-black/45";
const bodyRow = "border-b border-black/5 last:border-0";

/** 表彰2：スタイリスト別（合計いいね数の多い順） */
export function StylistRankingTable({ rows }: { rows: StylistRankingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 ring-1 ring-black/5">
        スタイリストが登録されていません。「スタイリスト」タブから追加してください。
      </p>
    );
  }

  const ranked = withRanks(rows, (r) => r.votes);
  const maxVotes = Math.max(...ranked.map((r) => r.votes), 1);

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/8">
            <th className={headCell}>順位</th>
            <th className={headCell}>スタイリスト</th>
            <th className={headCell}>所属</th>
            <th className={`${headCell} text-right`}>出品数</th>
            <th className={`${headCell} text-right`}>合計いいね</th>
            <th className={headCell}>　</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.stylistId} className={bodyRow}>
              <td className="px-3 py-2.5 text-base font-bold tabular-nums text-black/70">
                {row.votes > 0 ? row.rank : "—"}
              </td>
              <td className="px-3 py-2.5 font-medium">{row.name}</td>
              <td className="px-3 py-2.5 text-xs text-black/50">{salonLabel(row.salon)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-black/60">
                {row.styleCount}
              </td>
              <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums">
                {row.votes}
              </td>
              <td className="px-3 py-2.5">
                <div className="h-2 w-16 overflow-hidden rounded-full bg-black/8 sm:w-24">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(row.votes / maxVotes) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 表彰3：店舗賞（合計いいね数 ÷ 所属スタッフ数） */
export function SalonAwardTable({ rows }: { rows: SalonAwardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 ring-1 ring-black/5">
        所属店舗が設定されたスタイリストがいません。
        「スタイリスト」タブで所属店舗を設定してください。
      </p>
    );
  }

  const ranked = withRanks(rows, (r) => r.votesPerStylist);
  const max = Math.max(...ranked.map((r) => r.votesPerStylist), 1);

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/8">
            <th className={headCell}>順位</th>
            <th className={headCell}>店舗</th>
            <th className={`${headCell} text-right`}>合計いいね</th>
            <th className={`${headCell} text-right`}>所属スタッフ</th>
            <th className={`${headCell} text-right`}>1人あたり</th>
            <th className={headCell}>　</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.salon} className={bodyRow}>
              <td className="px-3 py-2.5 text-base font-bold tabular-nums text-black/70">
                {row.votes > 0 ? row.rank : "—"}
              </td>
              <td className="px-3 py-2.5 font-medium">{salonLabel(row.salon)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-black/60">{row.votes}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-black/60">
                {row.stylistCount}人
              </td>
              <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums">
                {row.votesPerStylist}
              </td>
              <td className="px-3 py-2.5">
                <div className="h-2 w-16 overflow-hidden rounded-full bg-black/8 sm:w-24">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(row.votesPerStylist / max) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-black/5 px-3 py-2.5 text-[11px] leading-relaxed text-black/40">
        1人あたり ＝ その店舗のスタイリストが集めた合計いいね数 ÷ 在籍スタッフ数。
        在籍スタッフ数は「スタイリスト」タブに登録された人数です。
      </p>
    </div>
  );
}
