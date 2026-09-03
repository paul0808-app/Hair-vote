import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ヘアスタイル投票 | PAUL・COCO",
  description: "気になるヘアスタイルに「いいね」して投票できます。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
