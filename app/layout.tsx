import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ヘアスタイル投票 | PAUL・COコ・行徳・Ali&LEVEL",
  description: "気になるヘアスタイルに「いいね」して投票できます。",
  // ホーム画面に追加したときに、アプリのように全画面で開くための設定
  appleWebApp: {
    capable: true,
    title: "ヘア投票",
    statusBarStyle: "default",
  },
  // 管理画面のURLが検索に出ないよう、サイト全体を検索対象外にする
  robots: { index: false, follow: false },
  other: {
    // 古いiPadOSでも全画面表示になるよう、従来の指定も残しておく
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iPad Safari の下端バーぶんの余白を CSS から使えるようにする
  viewportFit: "cover",
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
