"use client";

import { useEffect, useState } from "react";
/** サムネイルの表示に必要な情報だけを受け取る */
type ThumbSource = {
  title: string;
  imageUrl: string;
  thumbUrl?: string | null;
};

/** これ以上待っても写真が来ないときは、スタイル名だけの表示に切り替える（ミリ秒） */
const IMAGE_TIMEOUT_MS = 6000;

/** 小さなサムネイル。写真が届かないときはスタイル名を表示する */
export function Thumb({ style }: { style: ThumbSource }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(
      () => setState((prev) => (prev === "loading" ? "failed" : prev)),
      IMAGE_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className="relative h-full w-full">
      {state !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-1">
          {state === "failed" && (
            <span className="line-clamp-3 text-center text-[10px] font-medium text-stone-600">
              {style.title}
            </span>
          )}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={style.thumbUrl ?? style.imageUrl}
        alt={style.title}
        onLoad={() => setState("loaded")}
        onError={() => setState("failed")}
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          state === "loaded" ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
