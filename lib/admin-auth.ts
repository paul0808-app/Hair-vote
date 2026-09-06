import "server-only";

export type AdminAccess = "ok" | "denied" | "not-configured";

/** 文字数の違いや先頭一致から鍵を推測されないよう、常に同じ手間で比べる */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * 管理画面の合言葉を確かめる。
 * 環境変数 ADMIN_KEY と、URLの ?key= が一致したときだけ通す。
 */
export function checkAdminKey(key: string | undefined | null): AdminAccess {
  const expected = (process.env.ADMIN_KEY ?? "").trim();
  if (expected === "") return "not-configured";
  if (!key || !safeEqual(key, expected)) return "denied";
  return "ok";
}
