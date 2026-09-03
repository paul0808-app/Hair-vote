"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Thumb } from "./thumb";
import type { Style } from "@/lib/types";

/** 誤タップ防止のため、リセットは2秒の長押しが必要 */
const HOLD_MS = 2000;

type Props = {
  selected: Style[];
  onReset: () => void;
};

/** 投票が終わったあとの「ありがとうございました」画面 */
export function ThanksScreen({ selected, onReset }: Props) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHold = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const startHold = useCallback(() => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onReset();
    }, HOLD_MS);
  }, [onReset]);

  // 画面から離れるときにタイマーを片付ける
  useEffect(() => cancelHold, [cancelHold]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center px-5 pt-12 pb-8 text-center sm:pt-20">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 sm:h-20 sm:w-20">
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-accent sm:h-11 sm:w-11" aria-hidden="true">
          <path
            d="M4.5 12.5l5 5 10-11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <h1 className="mt-6 text-2xl font-bold sm:text-4xl">ご投票ありがとうございました</h1>
      <p className="mt-3 text-sm text-black/55 sm:text-base">
        お選びいただいたスタイルは、今後の参考にさせていただきます。
      </p>

      <div className="mt-9 w-full">
        <p className="mb-3 text-sm font-medium text-black/45">選んだスタイル</p>
        <div className="flex flex-wrap justify-center gap-3">
          {selected.map((style, i) => (
            <div key={style.id} className="w-24 sm:w-36">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/10">
                <Thumb style={style} />
                <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs text-black/60">{style.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* スタッフ用のリセット。誤タップしないよう2秒の長押しが必要 */}
      <div className="mt-auto w-full pt-14">
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full max-w-xs mx-auto block select-none overflow-hidden rounded-full border border-black/15 px-5 py-3 text-sm font-medium text-black/50 touch-none"
        >
          {/* 長押ししている間、下地が左から伸びる */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-accent/15 transition-[width] ease-linear"
            style={{ width: holding ? "100%" : "0%", transitionDuration: holding ? `${HOLD_MS}ms` : "150ms" }}
          />
          <span className="relative">
            {holding ? "そのまま押し続けてください…" : "次のお客様へ（長押し2秒でリセット）"}
          </span>
        </button>
      </div>
    </div>
  );
}
