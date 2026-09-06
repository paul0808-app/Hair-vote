"use client";

/**
 * iPadで選んだ写真は1枚3〜5MBあることが多く、そのまま使うと表示が遅くなる。
 * アップロードする前にブラウザの中で縮小して、通信量を1/10以下に減らす。
 *
 * 一覧用（小）と拡大表示用（大）の2枚を作る。
 */

/** 拡大表示に使う写真の最大の辺（px） */
const FULL_MAX = 1400;
/** 一覧のタイルに使う写真の最大の辺（px） */
const THUMB_MAX = 500;

export type PreparedImages = {
  full: File;
  thumb: File;
  /** 縮小前後の大きさ。画面に表示して安心してもらうために返す */
  originalBytes: number;
  fullBytes: number;
  thumbBytes: number;
};

type Drawable = ImageBitmap | HTMLImageElement;

async function loadImage(file: File): Promise<Drawable> {
  // createImageBitmap は写真の向き（縦横）の情報も反映してくれる
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // 古いブラウザ向けに、下の方法で読み直す
      }
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

function sizeOf(source: Drawable): { width: number; height: number } {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

async function toJpeg(source: Drawable, maxEdge: number, quality: number, name: string): Promise<File> {
  const { width, height } = sizeOf(source);
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を変換できませんでした");
  // 写真なので、余白は白で埋める（透過PNGを変換したときの黒ずみ防止）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("画像を変換できませんでした");
  return new File([blob], name, { type: "image/jpeg" });
}

/** 写真を、拡大用と一覧用の2枚に縮小する */
export async function prepareImages(file: File): Promise<PreparedImages> {
  const source = await loadImage(file);
  try {
    const full = await toJpeg(source, FULL_MAX, 0.85, "full.jpg");
    const thumb = await toJpeg(source, THUMB_MAX, 0.8, "thumb.jpg");
    return {
      full,
      thumb,
      originalBytes: file.size,
      fullBytes: full.size,
      thumbBytes: thumb.size,
    };
  } finally {
    if (!(source instanceof HTMLImageElement)) source.close();
  }
}

/** 「2.4MB」のような読みやすい表記にする */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
