"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  /** 表示時間（ミリ秒） */
  durationMs?: number;
};

/** 画面下から出てくる短いお知らせ。2秒で自動的に消える */
export function Toast({ message, onDismiss, durationMs = 2000 }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in fixed left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-full bg-ink/92 px-5 py-3 text-center text-sm font-medium text-white shadow-xl sm:text-base"
      style={{ bottom: "calc(112px + env(safe-area-inset-bottom))" }}
    >
      {message}
    </div>
  );
}
