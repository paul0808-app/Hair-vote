import type { Metadata } from "next";

/**
 * 管理画面だけ、ホーム画面用の設定（manifest）を読み込まないようにする。
 *
 * manifest には「アイコンから開いたときに表示するURL」が書いてあり、
 * それが投票画面（/）になっている。管理画面でこれを読み込んだままだと、
 * 管理画面をホーム画面に追加しても、アイコンから開いたときに
 * 投票画面へ飛んでしまう。
 *
 * 読み込まないようにすると、iPadは「いま開いているURL」をそのまま覚えるので、
 * 合言葉つきの管理画面のURLでアイコンが作られる。
 */
export const metadata: Metadata = {
  title: "管理画面 | ヘアスタイル投票",
  manifest: null,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
