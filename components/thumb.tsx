"use client";

import { useEffect, useRef, useState } from "react";

/** サムネイルの表示に必要な情報だけを受け取る */
type ThumbSource = {
  title: string;
  imageUrl: string;
  thumbUrl?: string | null;
};

/** これ以上待つならスタイル名を先に出す（ミリ秒）。読み込みは止めない */
const SHOW_TITLE_AFTER_MS = 3500;
const MAX_RETRIES = 4;
const RETRY_DELAYS_MS = [1200, 2500, 5000, 10000];

/**
 * 小さなサムネイル。
 * 写真が届くまではスタイル名を出し、届いた時点で写真に切り替える。
 * 失敗したときも間隔を空けて試し直す。
 */
export function Thumb({ style }: { style: ThumbSource }) {
  const [state, setState] = useState<"loading" | "loaded" | "waiting">("loading");
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const baseUrl = style.thumbUrl ?? style.imageUrl;
  const src = attempt === 0 ? baseUrl : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}r=${attempt}`;

  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(
      () => setState((prev) => (prev === "loading" ? "waiting" : prev)),
      SHOW_TITLE_AFTER_MS,
    );
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  const handleErrorRef = useRef<() => void>(() => {});

  // 画面が動き出す前に読み込みが終わっていた場合に備えて、実際の状態を確かめる
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) setState("loaded");
    else handleErrorRef.current();
  }, [attempt]);

  const handleError = () => {
    setState("waiting");
    if (attempt >= MAX_RETRIES) return;
    retryTimer.current = setTimeout(
      () => setAttempt((n) => n + 1),
      RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)],
    );
  };

  handleErrorRef.current = handleError;

  return (
    <div className="relative h-full w-full">
      {state !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-1">
          {state === "waiting" && (
            <span className="line-clamp-3 text-center text-[10px] font-medium text-stone-600">
              {style.title}
            </span>
          )}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={attempt}
        ref={imgRef}
        src={src}
        alt={style.title}
        onLoad={() => setState("loaded")}
        onError={handleError}
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          state === "loaded" ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
