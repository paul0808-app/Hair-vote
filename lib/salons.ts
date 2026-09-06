/**
 * 参加店舗の一覧。ここが唯一の定義元。
 * 店舗を増やすときは、この配列とラベルに1行足すだけで、
 * 投票URL・管理画面の絞り込み・写真の登録フォーム・CSV のすべてに反映される。
 */

/** データベースに保存される店舗コード。いちど決めたら変えない */
export const SALON_CODES = ["PAUL", "COCO", "GYOTOKU", "ALI_LEVEL"] as const;

export type SalonCode = (typeof SALON_CODES)[number];

/** 画面に表示する店舗名。こちらは自由に変えてよい */
export const SALON_LABELS: Record<SalonCode, string> = {
  PAUL: "PAUL",
  COCO: "COコ",
  GYOTOKU: "行徳",
  ALI_LEVEL: "Ali&LEVEL",
};

/** URLや入力欄から来た文字列を、正しい店舗コードに直す。該当しなければ null */
export function parseSalonCode(value: string | null | undefined): SalonCode | null {
  if (!value) return null;
  // 「ali-level」「alilevel」のような書き方でも受け付ける
  const normalized = value.trim().toUpperCase().replace(/[-\s]/g, "_");
  const candidate = normalized === "ALILEVEL" ? "ALI_LEVEL" : normalized;
  return (SALON_CODES as readonly string[]).includes(candidate)
    ? (candidate as SalonCode)
    : null;
}

/** 店舗コードを表示名に直す。未設定なら「共通」 */
export function salonLabel(code: string | null | undefined): string {
  const parsed = parseSalonCode(code);
  return parsed ? SALON_LABELS[parsed] : "共通";
}
