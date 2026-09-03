"use client";

import { Thumb } from "./thumb";
import { MAX_SELECTION, type Style } from "@/lib/types";

type Props = {
  open: boolean;
  /** 選んだ写真（選択順に並んでいる） */
  selected: Style[];
  onCancel: () => void;
  onConfirm: () => void;
};

/** 「投票へ進む」を押したときに出る、最終確認のダイアログ */
export function ConfirmDialog({ open, selected, onCancel, onConfirm }: Props) {
  if (!open) return null;

  const count = selected.length;
  const message =
    count === MAX_SELECTION
      ? `選んだ${MAX_SELECTION}枚で投票を確定します。確定後は変更できません。`
      : `${count}枚で投票します。よろしいですか？`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <h2 id="confirm-title" className="text-center text-xl font-bold sm:text-2xl">
          本当に投票しますか？
        </h2>
        <p className="mt-2 text-center text-sm text-black/60 sm:text-base">{message}</p>

        {/* 選んだ写真の最終確認 */}
        <div className="mt-5 flex justify-center gap-2">
          {selected.map((style, i) => (
            <div key={style.id} className="relative w-full max-w-20 shrink">
              <div className="aspect-square overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/10">
                <Thumb style={style} />
              </div>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-black/8 py-4 text-base font-bold text-black/70 active:scale-95 sm:text-lg"
          >
            もどる
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-[1.4] rounded-full bg-accent py-4 text-base font-bold text-white shadow-sm active:scale-95 sm:text-lg"
          >
            投票を確定する
          </button>
        </div>
      </div>
    </div>
  );
}
