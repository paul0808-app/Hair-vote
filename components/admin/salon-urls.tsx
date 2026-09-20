"use client";

import { useEffect, useState } from "react";
import { Toast } from "../toast";
import { SALON_CODES, SALON_LABELS, SALON_SEAT_COUNTS } from "@/lib/salons";

export function SalonUrls() {
  // 実際に開いているURLから組み立てるので、URLが変わっても直す必要がない
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
    } catch {
      setToast("コピーできませんでした。URLを長押しして選択してください");
    }
  };

  const seatUrl = (code: string, seat: number) => `${origin}/?salon=${code}&seat=${seat}`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-bold text-black/70">タブレットで開くURL</h2>
        <p className="mt-2 text-xs leading-relaxed text-black/50">
          各席のタブレットで、その席のURLを開いてください。店舗と席番号が記録され、
          管理画面で店舗ごとに集計できるようになります。
          <br />
          一度このURLで開けば、そのタブレットは店舗と席番号を覚えます。
          次からは普通に開いても大丈夫です。
        </p>
      </section>

      {SALON_CODES.map((code) => {
        const seats = Array.from({ length: SALON_SEAT_COUNTS[code] }, (_, i) => i + 1);
        return (
          <section key={code} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                {SALON_LABELS[code]}
                <span className="ml-1.5 text-xs font-medium text-black/40">
                  {seats.length}席
                </span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  copy(
                    seats.map((seat) => `${seat}席 ${seatUrl(code, seat)}`).join("\n"),
                    `${SALON_LABELS[code]}の${seats.length}席ぶんをコピーしました`,
                  )
                }
                className="rounded-full bg-black/8 px-4 py-2 text-xs font-bold text-black/70 active:scale-95"
              >
                {seats.length}席ぶんまとめてコピー
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {seats.map((seat) => {
                const url = seatUrl(code, seat);
                return (
                  <li key={seat} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-xs font-medium text-black/45">
                      {seat}席
                    </span>
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-black/5 px-2.5 py-2 text-xs text-black/70">
                      {url}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(url, `${SALON_LABELS[code]} ${seat}席のURLをコピーしました`)}
                      className="shrink-0 rounded-lg bg-black/8 px-3 py-2 text-xs font-medium active:scale-95"
                    >
                      コピー
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-bold text-black/70">ホーム画面に追加してアプリのように使う</h2>
        <ol className="mt-3 space-y-2 text-xs leading-relaxed text-black/60">
          <li>1. その席のタブレットのSafariで、上のURLを開く</li>
          <li>2. 画面上部の「共有」ボタン（□に↑のマーク）をタップ</li>
          <li>3. メニューから「ホーム画面に追加」を選ぶ</li>
          <li>4. 名前は「ヘア投票」のままで「追加」</li>
          <li>5. ホーム画面のピンクのハートのアイコンから開く</li>
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-black/40">
          アイコンから開くとアドレスバーが消え、全画面で表示されます。
          お客様が誤って他のページに移動することもありません。
          <br />
          席が増えたときは、URLの <code>seat=</code> の後ろの数字を書き換えれば使えます。
        </p>
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} durationMs={2200} />
    </div>
  );
}
