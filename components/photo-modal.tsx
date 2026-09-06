"use client";

import { useEffect, useRef, useState } from "react";
import type { Style } from "@/lib/types";

type Props = {
  styles: Style[];
  /** 何枚目を表示しているか（0から数える）。null なら閉じている */
  index: number | null;
  order: number | null;
  onClose: () => void;
  onMove: (nextIndex: number) => void;
  onToggle: (style: Style) => void;
};

/** スワイプと判定する指の移動距離（px） */
const SWIPE_X = 60;
const SWIPE_Y = 90;

/** これ以上待っても写真が来ないときは、スタイル名だけの表示に切り替える（ミリ秒） */
const IMAGE_TIMEOUT_MS = 6000;

export function PhotoModal({ styles, index, order, onClose, onMove, onToggle }: Props) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [imageState, setImageState] = useState<"loading" | "loaded" | "failed">("loading");

  const isOpen = index !== null;
  const style = isOpen ? styles[index] : null;
  const selected = order !== null;

  // 写真が切り替わったら、読み込み状態をリセットする
  useEffect(() => setImageState("loading"), [index]);

  // 一定時間たっても届かない写真は、待ち続けずスタイル名の表示に切り替える
  useEffect(() => {
    if (imageState !== "loading") return;
    const timer = setTimeout(
      () => setImageState((prev) => (prev === "loading" ? "failed" : prev)),
      IMAGE_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [imageState]);

  // モーダルを開いている間は、後ろのグリッドがスクロールしないようにする
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // キーボードでも操作できるようにする（動作確認や外付けキーボード用）
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onMove(index - 1);
      if (e.key === "ArrowRight" && index < styles.length - 1) onMove(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, styles.length, onClose, onMove]);

  if (index === null || !style) return null;

  const hasPrev = index > 0;
  const hasNext = index < styles.length - 1;

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_X) {
      // 左スワイプ＝次の写真、右スワイプ＝前の写真
      if (dx < 0 && hasNext) onMove(index + 1);
      if (dx > 0 && hasPrev) onMove(index - 1);
      return;
    }
    // 下スワイプで閉じる
    if (dy > SWIPE_Y) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${style.title} の詳細`}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={handleTouchEnd}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 右上の閉じるボタン */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="閉じる"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/30"
        style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 何枚目か */}
      <p className="pt-4 text-center text-sm font-medium text-white/70 tabular-nums">
        {index + 1} / {styles.length}
      </p>

      {/* 写真本体と、その左右の矢印ボタン */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-3 sm:px-14">
        <ArrowButton side="left" disabled={!hasPrev} onClick={() => onMove(index - 1)} />

        <div
          className="relative flex h-full max-h-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {imageState !== "loaded" && (
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-stone-700 p-4 text-center text-sm text-stone-200 sm:h-80 sm:w-80">
              {imageState === "failed" ? style.title : ""}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={style.imageUrl}
            alt={style.title}
            onLoad={() => setImageState("loaded")}
            onError={() => setImageState("failed")}
            className={[
              "max-h-full max-w-full rounded-2xl object-contain shadow-2xl",
              imageState === "loaded" ? "" : "hidden",
            ].join(" ")}
          />
        </div>

        <ArrowButton side="right" disabled={!hasNext} onClick={() => onMove(index + 1)} />
      </div>

      {/* キャプションと「いいね」ボタン */}
      <div
        className="shrink-0 bg-black/40 px-4 pb-4 pt-3 text-white sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-lg font-bold sm:text-2xl">{style.title}</h2>
          {style.caption && (
            <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{style.caption}</p>
          )}
          {style.tags && style.tags.length > 0 && (
            <p className="mt-2 text-sm text-white/60">
              {style.tags.map((t) => `#${t}`).join("　")}
            </p>
          )}

          <button
            type="button"
            onClick={() => onToggle(style)}
            className={[
              "mt-4 flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-lg font-bold transition active:scale-[0.98]",
              selected ? "bg-white text-accent" : "bg-accent text-white",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path
                d="M12 20.3l-1.35-1.23C5.9 14.86 3 12.23 3 8.99 3 6.4 5.02 4.4 7.6 4.4c1.46 0 2.86.68 3.77 1.76l.63.74.63-.74A4.97 4.97 0 0 1 16.4 4.4C18.98 4.4 21 6.4 21 8.99c0 3.24-2.9 5.87-7.65 10.09L12 20.3z"
                fill={selected ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {selected ? "選択を解除" : "いいね"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={side === "left" ? "前の写真" : "次の写真"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={[
        "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition",
        side === "left" ? "left-1 sm:left-2" : "right-1 sm:right-2",
        disabled ? "opacity-0" : "bg-white/15 active:bg-white/30",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
