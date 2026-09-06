import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase への接続。
 *
 * 大事な点：ここで使う「サービスロールキー」は絶対にブラウザへ送られない。
 * `server-only` を読み込むことで、うっかり画面側のコードから使うとビルドが失敗する。
 * データベースは RLS（アクセス制限）を有効にしてあるので、
 * このキーを持つサーバー側からしか読み書きできない。
 */

/**
 * 貼り付け方の違いを吸収する。
 * 「https://」が抜けていても、末尾に「/」が付いていてもつながるようにする。
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed === "") return "";
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const url = normalizeUrl(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const serviceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  ""
).trim();

/** 環境変数（接続情報）がそろっているか */
export function isSupabaseConfigured(): boolean {
  return url.length > 0 && serviceKey.length > 0;
}

let client: SupabaseClient | null = null;

/** 接続情報が無い場合は null を返す。呼び出し側で仮データに切り替える */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
