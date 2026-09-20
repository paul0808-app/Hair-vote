"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "../toast";
import { resetCountsAction, undoResetAction } from "@/app/admin/actions";

/** 日本時間で「2026年9月20日 16:30」の形にする */
function formatJst(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ResetPanel({ adminKey, resetAt }: { adminKey: string; resetAt: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, startAction] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    startAction(async () => {
      const result = await fn();
      setToast(result.message);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      }
    });
  };

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-black/70">集計のリセット</h2>
          <p className="mt-1 text-xs text-black/50">
            {resetAt ? (
              <>
                最終リセット：<span className="font-medium text-black/70">{formatJst(resetAt)}</span>
              </>
            ) : (
              "まだ一度もリセットしていません（すべての投票を集計しています）"
            )}
          </p>
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-full bg-black/8 px-5 py-2.5 text-xs font-bold text-black/70 active:scale-95"
          >
            集計をリセット
          </button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-full bg-black/8 px-4 py-2.5 text-xs font-bold text-black/60 disabled:opacity-50"
            >
              やめる
            </button>
            <button
              type="button"
              onClick={() => run(() => resetCountsAction(adminKey))}
              disabled={busy}
              className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {busy ? "処理中…" : "本当にリセットする"}
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <p className="mt-3 rounded-xl bg-accent/8 px-3 py-2.5 text-xs leading-relaxed text-black/60">
          総投票数・総いいね数・ランキングが0に戻ります。
          <br />
          <strong className="text-black/75">投票データそのものは消えません。</strong>
          「ここから先を数える」という開始点を今の時刻にするだけなので、
          押し間違えてもすぐ元に戻せます。
        </p>
      )}

      {resetAt && !confirming && (
        <button
          type="button"
          onClick={() => run(() => undoResetAction(adminKey))}
          disabled={busy}
          className="mt-2 text-xs text-black/40 underline underline-offset-2 disabled:opacity-50"
        >
          リセットを取り消して、これまでの集計に戻す
        </button>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} durationMs={2600} />
    </section>
  );
}
