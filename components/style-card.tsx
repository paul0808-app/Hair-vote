"use client";

import { useEffect, useRef, useState } from "react";
import type { Style } from "@/lib/types";

type Props = {
  style: Style;
  /** 選択順（1〜5）。未選択なら null */
  order: number | null;
  /** 1回タップしたとき。拡大モーダルを開く */
  onOpen: (style: Style) => void;
  /** 2回続けてタップしたとき。拡大せずに選択・解除する */
  onToggle: (style: Style) => void;
  /** 最初に画面に見えている数枚だけ先に読み込む */
  eager: boolean;
};

/**
 * 写真の読み込み状態。
 * "waiting" は「まだ届かないのでスタイル名を出しているが、読み込みは続けている」状態。
 * 届いた時点で "loaded" になり、写真に切り替わる。
 */
type ImageState = "loading" | "loaded" | "waiting";

/** これ以上待つならスタイル名を先に出す（ミリ秒）。読み込みは止めない */
const SHOW_TITLE_AFTER_MS = 3500;

/** 読み込みに失敗したときに、間隔を空けて試し直す回数と待ち時間 */
const MAX_RETRIES = 4;
const RETRY_DELAYS_MS = [1200, 2500, 5000, 10000];

/** この時間内にもう一度タップされたら「2タップ」とみなす（ミリ秒） */
const DOUBLE_TAP_MS = 260;

export function StyleCard({ style, order, onOpen, onToggle, eager }: Props) {
  const [imageState, setImageState] = useState<ImageState>("loading");
  /** 何回目の試行か。srcに付けて、ブラウザに取得し直させる */
  const [attempt, setAttempt] = useState(0);
  const cardRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // 1回目のタップを少し待ち、その間に2回目が来たかどうかで動作を分ける
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // このカードが画面に近づいたか（近づいてから待ち時間を計り始める）
  const [nearViewport, setNearViewport] = useState(eager);

  const selected = order !== null;
  const baseUrl = style.thumbUrl ?? style.imageUrl;
  // 試し直すときだけ印を付ける。付けないとブラウザが失敗を覚えていて再取得しない
  const src = attempt === 0 ? baseUrl : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}r=${attempt}`;

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
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  // しばらく届かないときは、先にスタイル名を出す。読み込み自体は続けている
  useEffect(() => {
    if (!nearViewport || imageState !== "loading") return;
    const timer = setTimeout(
      () => setImageState((prev) => (prev === "loading" ? "waiting" : prev)),
      SHOW_TITLE_AFTER_MS,
    );
    return () => clearTimeout(timer);
  }, [nearViewport, imageState]);

  // 画面から離れるときに、待機中の処理を片付ける
  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  /**
   * 画面が動き出す前に読み込みが終わっていた場合、完了や失敗の合図を
   * 受け取れずに固まってしまう。表示のたびに実際の状態を直接確かめる。
   */
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) {
      setImageState("loaded");
    } else {
      handleErrorRef.current();
    }
    // 試行ごとに確かめたいので attempt を見る
  }, [attempt]);

  /** 読み込みに失敗したとき。あきらめずに間隔を空けて試し直す */
  const handleError = () => {
    setImageState("waiting");
    if (attempt >= MAX_RETRIES) return;
    retryTimer.current = setTimeout(
      () => setAttempt((n) => n + 1),
      RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)],
    );
  };

  // 上のチェックから最新の処理を呼べるようにしておく
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const handleTap = () => {
    if (tapTimer.current) {
      // 2回目のタップ：拡大せず、その場で選択・解除する
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      onToggle(style);
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      onOpen(style);
    }, DOUBLE_TAP_MS);
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleTap}
      aria-pressed={selected}
      aria-label={`${style.title}${selected ? `（${order}番目に選択中）` : ""}。1回タップで拡大、2回タップで選択`}
      // ダブルタップで画面が拡大してしまうのを防ぐ
      style={{ touchAction: "manipulation" }}
      className={[
        "group relative block w-full aspect-square overflow-hidden rounded-xl bg-black/5",
        "transition-transform duration-100 active:scale-[0.97]",
        // 選択中は太い枠線（3px）で囲む
        selected
          ? "ring-[3px] ring-accent ring-offset-2 ring-offset-paper"
          : "ring-1 ring-black/5",
      ].join(" ")}
    >
      {/* 届くまでのあいだの表示。薄いグレー → しばらくしたらスタイル名 */}
      {imageState === "loading" && <div className="absolute inset-0 placeholder-shimmer" />}
      {imageState === "waiting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-2">
          <span className="line-clamp-3 text-center text-[11px] font-medium text-stone-600 sm:text-sm">
            {style.title}
          </span>
        </div>
      )}

      {/*
        画像は常に置いたままにしてある。スタイル名を出している間も読み込みは続いていて、
        届いた時点で onLoad が動き、自動的に写真へ切り替わる。
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={attempt}
        ref={imgRef}
        src={src}
        alt={style.title}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={() => setImageState("loaded")}
        onError={handleError}
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
