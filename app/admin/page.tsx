import Link from "next/link";
import { notFound } from "next/navigation";
import { Filters } from "@/components/admin/filters";
import { RankingTable } from "@/components/admin/ranking-table";
import { StyleManager } from "@/components/admin/style-manager";
import { SummaryCards } from "@/components/admin/summary-cards";
import { checkAdminKey } from "@/lib/admin-auth";
import {
  SALON_FILTER_KEYS,
  getAdminData,
  getAllStyles,
  resolveRange,
  type PeriodKey,
  type SalonKey,
} from "@/lib/admin";

/** 管理画面のランキングは、キャッシュせず常に最新を表示する */
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const adminKey = one(params.key);
  const access = checkAdminKey(adminKey);

  // 合言葉が違うときは、管理画面の存在自体を知られないよう404を返す
  if (access === "denied") notFound();
  if (access === "not-configured") return <SetupNotice />;

  const periodParam = one(params.period);
  const period: PeriodKey = (
    ["today", "7d", "month", "all", "custom"] as const
  ).includes(periodParam as PeriodKey)
    ? (periodParam as PeriodKey)
    : "all";

  const salonParam = one(params.salon);
  const salon: SalonKey = SALON_FILTER_KEYS.includes(salonParam as SalonKey)
    ? (salonParam as SalonKey)
    : "all";

  const from = one(params.from);
  const to = one(params.to);
  const tab = one(params.tab) === "styles" ? "styles" : "ranking";

  const range = resolveRange(period, from, to);

  const [data, stylesResult] = await Promise.all([
    getAdminData(range, salon),
    tab === "styles" ? getAllStyles() : Promise.resolve({ styles: [], error: null }),
  ]);

  const tabLink = (next: "ranking" | "styles") => {
    const p = new URLSearchParams({ key: adminKey, period, salon, tab: next });
    if (period === "custom") {
      if (from) p.set("from", from);
      if (to) p.set("to", to);
    }
    return `/admin?${p.toString()}`;
  };

  const csvHref = (() => {
    const p = new URLSearchParams({ key: adminKey, period, salon });
    if (period === "custom") {
      if (from) p.set("from", from);
      if (to) p.set("to", to);
    }
    return `/admin/csv?${p.toString()}`;
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-xl font-bold sm:text-3xl">ヘアスタイル投票 管理画面</h1>
        <p className="mt-1 text-sm text-black/50">
          投票の集計と、投票画面に並べる写真の管理ができます。
        </p>
      </header>

      {/* 2つの画面の切り替え */}
      <nav className="mb-6 flex gap-2">
        {(
          [
            ["ranking", "ランキング"],
            ["styles", "写真の管理"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={tabLink(value)}
            className={[
              "rounded-full px-5 py-2.5 text-sm font-bold transition",
              tab === value ? "bg-ink text-white" : "bg-white text-black/60 ring-1 ring-black/10",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </nav>

      {(data.error || stylesResult.error) && (
        <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {data.error ?? stylesResult.error}
        </p>
      )}

      {tab === "ranking" ? (
        <div className="space-y-6">
          <Filters adminKey={adminKey} period={period} salon={salon} from={from} to={to} />
          <SummaryCards summary={data.summary} rangeLabel={range.label} />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-black/70">ランキング</h2>
              <a
                href={csvHref}
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black/70 ring-1 ring-black/10 active:scale-95"
              >
                CSVをダウンロード
              </a>
            </div>
            <RankingTable rows={data.ranking} />
          </div>
        </div>
      ) : (
        <StyleManager adminKey={adminKey} styles={stylesResult.styles} />
      )}
    </div>
  );
}

/** ADMIN_KEY をまだ設定していないときに出る案内 */
function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="text-xl font-bold">管理画面の合言葉が未設定です</h1>
      <p className="mt-3 text-sm leading-relaxed text-black/60">
        管理画面を開くには、Vercel に <code className="rounded bg-black/8 px-1.5 py-0.5">ADMIN_KEY</code>{" "}
        という環境変数を追加してください。
      </p>
      <ol className="mt-5 space-y-2 text-sm leading-relaxed text-black/70">
        <li>1. Vercel → プロジェクト → Settings → Environment Variables を開く</li>
        <li>
          2. <strong>Key</strong> に <code className="rounded bg-black/8 px-1.5 py-0.5">ADMIN_KEY</code>{" "}
          と入力
        </li>
        <li>
          3. <strong>Value</strong> に、推測されにくい長めの文字列を自分で決めて入力
          （例：<code className="rounded bg-black/8 px-1.5 py-0.5">paul-coco-2026-7fk29xq</code>）
        </li>
        <li>4. 環境は Production / Preview / Development すべてにチェックして Save</li>
        <li>5. Deployments → 最新の「…」→ Redeploy</li>
        <li>
          6. <code className="rounded bg-black/8 px-1.5 py-0.5">/admin?key=決めた文字列</code>{" "}
          を開く
        </li>
      </ol>
      <p className="mt-5 text-xs text-black/45">
        この合言葉を知っている人だけが管理画面を開けます。お客様に見せないURLなので、
        スタッフ間だけで共有してください。
      </p>
    </div>
  );
}
