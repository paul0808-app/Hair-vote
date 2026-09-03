/** ヘアスタイル写真1枚ぶんのデータ。将来 Supabase の styles テーブルと同じ形にしてある */
export type Style = {
  id: string;
  imageUrl: string;
  thumbUrl?: string | null;
  title: string;
  stylist?: string | null;
  caption?: string | null;
  tags?: string[] | null;
  salon?: "PAUL" | "COCO" | null;
  displayOrder: number;
  isActive: boolean;
};

/** 1回の投票で選べる写真の上限 */
export const MAX_SELECTION = 5;
