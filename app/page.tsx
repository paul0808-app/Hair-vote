import { VoteScreen } from "@/components/vote-screen";
import { getStyles } from "@/lib/styles";

/**
 * 投票画面は写真一覧を読み込むだけなので、5分間キャッシュして
 * データベースへの負荷をかけないようにする（同時接続対策）。
 */
export const revalidate = 300;

/** 写真の配信元を調べる。先に接続だけ済ませておくと表示が早くなる */
function imageOrigins(urls: string[]): string[] {
  const origins = new Set<string>();
  for (const url of urls) {
    try {
      origins.add(new URL(url).origin);
    } catch {
      // URLとして読めないものは無視する
    }
  }
  return [...origins];
}

export default async function Page() {
  const { styles, usingDummyData } = await getStyles();
  const origins = imageOrigins(styles.map((s) => s.thumbUrl ?? s.imageUrl));

  return (
    <>
      {/*
        写真を取りに行く前に、配信元との接続（名前解決・暗号化のやりとり）を
        済ませておく。1枚目が出るまでの時間が短くなる。
      */}
      {origins.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      <VoteScreen styles={styles} usingDummyData={usingDummyData} />
    </>
  );
}
