"use client";

import { useEffect, useState } from "react";
import { Toast } from "../toast";
import { SALON_CODES, SALON_LABELS } from "@/lib/salons";

/** 席番号の例。実際の席数に合わせて自由に変えて使ってもらう */
const SEAT_EXAMPLES = ["A1", "A2", "B1", "B2"];

export function SalonUrls() {
  // 実際に開いているURLから組み立てるので、URLが変わっても直す必要がない
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setToast("URLをコピーしました");
    } catch {
      setToast("コピーできませんでした。URLを長押しして選択してください");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-bold text-black/70">タブレットで開くURL</h2>
        <p className="mt-2 text-xs leading-relaxed text-black/50">
          各店舗のタブレットで下のURLを開いてください。店舗と席番号が記録され、
          管理画面で店舗ごとに集計できるようになります。
          <br />
          一度このURLで開けば、そのタブレットは店舗と席番号を覚えます。
          次からは普通に開いても大丈夫です。
        </p>
      </section>

      {SALON_CODES.map((code) => (
        <section key={code} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <h3 className="text-sm font-bold">{SALON_LABELS[code]}</h3>
          <ul className="mt-3 space-y-2">
            {SEAT_EXAMPLES.map((seat) => {
              const url = `${origin}/?salon=${code}&seat=${seat}`;
              return (
                <li key={seat} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs font-medium text-black/45">{seat}席</span>
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-black/5 px-2.5 py-2 text-xs text-black/70">
                    {url}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(url)}
                    className="shrink-0 rounded-lg bg-black/8 px-3 py-2 text-xs font-medium active:scale-95"
                  >
                    コピー
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-black/40">
            席番号は自由に決められます。URLの <code>seat=</code> の後ろを書き換えてください。
          </p>
        </section>
      ))}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-bold text-black/70">ホーム画面に追加してアプリのように使う</h2>
        <ol className="mt-3 space-y-2 text-xs leading-relaxed text-black/60">
          <li>1. タブレットのSafariで、上のURLを開く</li>
          <li>2. 画面上部の「共有」ボタン（□に↑のマーク）をタップ</li>
          <li>3. メニューから「ホーム画面に追加」を選ぶ</li>
          <li>4. 名前は「ヘア投票」のままで「追加」</li>
          <li>5. ホーム画面のピンクのハートのアイコンから開く</li>
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-black/40">
          アイコンから開くとアドレスバーが消え、全画面で表示されます。
          お客様が誤って他のページに移動することもありません。
        </p>
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} durationMs={2200} />
    </div>
  );
}
