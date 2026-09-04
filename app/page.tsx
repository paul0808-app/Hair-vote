import { VoteScreen } from "@/components/vote-screen";
import { getStyles } from "@/lib/styles";

/**
 * 投票画面は写真一覧を読み込むだけなので、5分間キャッシュして
 * データベースへの負荷をかけないようにする（同時接続対策）。
 */
export const revalidate = 300;

export default async function Page() {
  const { styles, usingDummyData } = await getStyles();

  return <VoteScreen styles={styles} usingDummyData={usingDummyData} />;
}
