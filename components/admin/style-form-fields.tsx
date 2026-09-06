import type { AdminStyle } from "@/lib/admin-shared";

/** 追加フォームと編集フォームで共通の入力欄 */
export function StyleFormFields({ style }: { style?: AdminStyle }) {
  const label = "block text-xs font-medium text-black/50";
  const input =
    "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-base text-ink";

  return (
    <div className="space-y-3">
      <label className={label}>
        スタイル名（必須）
        <input
          name="title"
          required
          defaultValue={style?.title ?? ""}
          placeholder="例：くびれミディ"
          className={input}
        />
      </label>

      <label className={label}>
        担当スタイリスト
        <input
          name="stylist"
          defaultValue={style?.stylist ?? ""}
          placeholder="例：田中 美咲"
          className={input}
        />
      </label>

      <label className={label}>
        説明文
        <textarea
          name="caption"
          rows={2}
          defaultValue={style?.caption ?? ""}
          placeholder="例：顔まわりのレイヤーで小顔に見せるミディアム。"
          className={input}
        />
      </label>

      <label className={label}>
        ハッシュタグ（スペースかカンマで区切る）
        <input
          name="tags"
          defaultValue={style?.tags?.join(" ") ?? ""}
          placeholder="例：ミディアム レイヤー 小顔"
          className={input}
        />
      </label>

      <label className={label}>
        店舗
        <select name="salon" defaultValue={style?.salon ?? ""} className={input}>
          <option value="">共通（両店に表示）</option>
          <option value="PAUL">PAUL西葛西</option>
          <option value="COCO">COコ西葛西南口</option>
        </select>
      </label>
    </div>
  );
}
