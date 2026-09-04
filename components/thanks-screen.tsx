"use client";

import { Thumb } from "./thumb";
import type { Style } from "@/lib/types";

type Props = {
  selected: Style[];
  onReset: () => void;
};

/** 投票が終わったあとの「ありがとうございました」画面 */
export function ThanksScreen({ selected, onReset }: Props) {
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

      {/* スタッフ用のリセット。1タップで次のお客様の投票が始まる */}
      <div className="mt-auto w-full pt-14">
        <button
          type="button"
          onClick={onReset}
          className="mx-auto block w-full max-w-xs rounded-full border border-black/15 px-5 py-3 text-sm font-medium text-black/50 active:scale-95 active:bg-black/5"
        >
          次のお客様へ（リセット）
        </button>
      </div>
    </div>
  );
}
