"use client";

import { useEffect, useRef, useState } from "react";
import type { Style } from "@/lib/types";

type Props = {
  style: Style;
  /** 選択順（1〜5）。未選択なら null */
  order: number | null;
  /** 写真をタップしたとき。拡大モーダルを開く */
  onOpen: (style: Style) => void;
  /** 最初に画面に見えている数枚だけ先に読み込む */
  eager: boolean;
};

type ImageState = "loading" | "loaded" | "failed";

/** これ以上待っても写真が来ないときは、スタイル名だけの表示に切り替える（ミリ秒） */
const IMAGE_TIMEOUT_MS = 6000;

export function StyleCard({ style, order, onOpen, eager }: Props) {
  const [imageState, setImageState] = useState<ImageState>("loading");
  const cardRef = useRef<HTMLButtonElement>(null);
  // このカードが画面に近づいたか（近づいてから読み込みの時間を計り始める）
  const [nearViewport, setNearViewport] = useState(eager);
  const selected = order !== null;

  useEffect(() => {
    if (nearViewport) return;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  // 一定時間たっても届かない写真は、待ち続けずスタイル名の表示に切り替える。
  // 画像そのものは読み込みを続けているので、あとから届けば写真に差し替わる。
  useEffect(() => {
    if (!nearViewport || imageState !== "loading") return;
    const timer = setTimeout(
      () => setImageState((prev) => (prev === "loading" ? "failed" : prev)),
      IMAGE_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [nearViewport, imageState]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onOpen(style)}
      aria-pressed={selected}
      aria-label={`${style.title} を大きく見る${selected ? `（${order}番目に選択中）` : ""}`}
      className={[
        "group relative block w-full aspect-square overflow-hidden rounded-xl bg-black/5",
        "transition-transform duration-100 active:scale-[0.97]",
        // 選択中は太い枠線（3px）で囲む
        selected
          ? "ring-[3px] ring-accent ring-offset-2 ring-offset-paper"
          : "ring-1 ring-black/5",
      ].join(" ")}
    >
      {/* 読み込み中の薄いグレー */}
      {imageState === "loading" && <div className="absolute inset-0 placeholder-shimmer" />}

      {/* 写真が届かないときの代わりの表示（壊れた画像アイコンは出さない） */}
      {imageState === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-2">
          <span className="line-clamp-3 text-center text-[11px] font-medium text-stone-600 sm:text-sm">
            {style.title}
          </span>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={style.thumbUrl ?? style.imageUrl}
        alt={style.title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setImageState("loaded")}
        onError={() => setImageState("failed")}
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          imageState === "loaded" ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* 選択中の薄い暗色オーバーレイ */}
      <div
        className={[
          "absolute inset-0 transition-colors duration-150",
          selected ? "bg-black/35" : "bg-transparent",
        ].join(" ")}
      />

      {/* 右上の丸バッジ（選択順の番号） */}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base font-bold text-white shadow-lg sm:h-9 sm:w-9 sm:text-lg">
          {order}
        </span>
      )}

      {/* 左下のチェックマーク */}
      {selected && (
        <span className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow sm:h-8 sm:w-8">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" aria-hidden="true">
            <path
              d="M4.5 12.5l5 5 10-11"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
