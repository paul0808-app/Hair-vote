import type { MetadataRoute } from "next";

/**
 * 「ホーム画面に追加」したときの設定。
 * display: "standalone" にすると、Safariのアドレスバーが消えて
 * アプリのように全画面で開く（お客様が他のサイトへ移動しにくくなる）。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ヘアスタイル投票",
    short_name: "ヘア投票",
    description: "気になるヘアスタイルに「いいね」して投票できます。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#e11d48",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
