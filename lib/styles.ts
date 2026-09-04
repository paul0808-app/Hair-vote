import "server-only";
import { DUMMY_STYLES } from "./dummy-styles";
import { getSupabase } from "./supabase";
import type { Style } from "./types";

/** データベースの列名（snake_case）を、画面で使う名前に変換する */
type StyleRow = {
  id: string;
  image_url: string;
  thumb_url: string | null;
  title: string;
  stylist: string | null;
  caption: string | null;
  tags: string[] | null;
  salon: string | null;
  display_order: number;
  is_active: boolean;
};

function toStyle(row: StyleRow): Style {
  return {
    id: row.id,
    imageUrl: row.image_url,
    thumbUrl: row.thumb_url,
    title: row.title,
    stylist: row.stylist,
    caption: row.caption,
    tags: row.tags,
    salon: row.salon === "PAUL" || row.salon === "COCO" ? row.salon : null,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

export type StylesResult = {
  styles: Style[];
  /** 仮データを表示しているかどうか（接続前や取得失敗のとき true） */
  usingDummyData: boolean;
};

/**
 * 投票画面に並べる写真の一覧。
 * 接続情報が無いときや取得に失敗したときは、仮データに切り替えて画面を止めない。
 */
export async function getStyles(): Promise<StylesResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { styles: DUMMY_STYLES, usingDummyData: true };
  }

  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[styles] 取得に失敗したため仮データを表示します:", error.message);
    return { styles: DUMMY_STYLES, usingDummyData: true };
  }
  if (!data || data.length === 0) {
    console.warn("[styles] styles テーブルが空です。seed.sql を実行してください。");
    return { styles: DUMMY_STYLES, usingDummyData: true };
  }

  return { styles: (data as StyleRow[]).map(toStyle), usingDummyData: false };
}
