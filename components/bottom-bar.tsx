"use client";

import { MAX_SELECTION } from "@/lib/types";

type Props = {
  count: number;
  onProceed: () => void;
};

export function BottomBar({ count, onProceed }: Props) {
  const isFull = count >= MAX_SELECTION;
  const canProceed = count > 0;

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t transition-colors duration-200",
        // 5枚そろったら色を変えて「選択完了」を知らせる
        isFull ? "border-accent bg-accent text-white" : "border-black/10 bg-white/95 text-ink",
        "backdrop-blur",
      ].join(" ")}
      // iPad Safari の下部バーに隠れないよう、端末が教えてくれる余白を足す
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <div className="min-w-0 flex-1 text-center">
          <p className="text-lg font-bold tabular-nums sm:text-2xl">
            {isFull ? (
              "選択完了！"
            ) : (
              <>
                <span className="text-2xl sm:text-3xl">{count}</span>枚
                <span className="mx-1 opacity-50">/</span>
                {MAX_SELECTION}枚 選択中
              </>
            )}
          </p>

          {/* 残り枚数のドット ●●○○○ */}
          <div className="mt-1.5 flex justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: MAX_SELECTION }).map((_, i) => (
              <span
                key={i}
                className={[
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  i < count
                    ? isFull
                      ? "bg-white"
                      : "bg-accent"
                    : isFull
                      ? "bg-white/40"
                      : "bg-black/15",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={!canProceed}
          className={[
            "shrink-0 rounded-full px-6 py-3.5 text-base font-bold shadow-sm transition sm:px-9 sm:py-4 sm:text-lg",
            "disabled:cursor-not-allowed",
            canProceed
              ? isFull
                ? "bg-white text-accent active:scale-95"
                : "bg-accent text-white active:scale-95"
              : "bg-black/10 text-black/35",
          ].join(" ")}
        >
          投票へ進む
        </button>
      </div>
    </div>
  );
}
