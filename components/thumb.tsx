"use client";

import { useState } from "react";
import type { Style } from "@/lib/types";

/** 小さなサムネイル。画像が届かないときはスタイル名を表示する */
export function Thumb({ style }: { style: Style }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-1">
        <span className="line-clamp-3 text-center text-[10px] font-medium text-stone-600">
          {style.title}
        </span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={style.thumbUrl ?? style.imageUrl}
      alt={style.title}
      onError={() => setError(true)}
      className="h-full w-full object-cover"
    />
  );
}
