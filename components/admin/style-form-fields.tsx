import { SALON_CODES, SALON_LABELS, salonLabel } from "@/lib/salons";
import type { AdminStyle, AdminStylist } from "@/lib/admin-shared";

type Props = {
  style?: AdminStyle;
  /** 担当者の選択肢（在籍中のスタイリスト） */
  stylists: AdminStylist[];
};

/** 追加フォームと編集フォームで共通の入力欄 */
export function StyleFormFields({ style, stylists }: Props) {
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
        <select name="stylist_id" defaultValue={style?.stylistId ?? ""} className={input}>
          <option value="">選択しない</option>
          {stylists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（{salonLabel(s.salon)}）
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[11px] font-normal text-black/35">
          一覧に無いときは「スタイリスト」タブから追加してください。
          お客様の画面には表示されません。
        </span>
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
        この写真を出す店舗
        <select name="salon" defaultValue={style?.salon ?? ""} className={input}>
          <option value="">共通（全店に表示）</option>
          {SALON_CODES.map((code) => (
            <option key={code} value={code}>
              {SALON_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
