import { VoteScreen } from "@/components/vote-screen";
import { DUMMY_STYLES } from "@/lib/dummy-styles";

export default function Page() {
  // フェーズ3で、この行を Supabase からの取得に差し替えます
  const styles = DUMMY_STYLES.filter((s) => s.isActive).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return <VoteScreen styles={styles} />;
}
