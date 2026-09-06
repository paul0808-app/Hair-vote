/**
 * 投票画面に渡すヘアスタイル写真のデータ。
 *
 * 担当スタイリスト名は、お客様には見せない方針のため**この型に含めない**。
 * スタイリスト名はデータベースには保存されており、管理画面の集計でのみ使う。
 */
export type Style = {
  id: string;
  imageUrl: string;
  thumbUrl?: string | null;
  title: string;
  caption?: string | null;
  tags?: string[] | null;
  salon?: string | null;
  displayOrder: number;
  isActive: boolean;
};

/** 1回の投票で選べる写真の上限 */
export const MAX_SELECTION = 5;

/** 投票を確定してから、自動で次のお客様用にリセットするまでの時間（30分） */
export const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/** 投票セッションの状態。'draft' = 選択中 / 'submitted' = 投票確定済み */
export type BallotStatus = "draft" | "submitted";
