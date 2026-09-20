"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "../toast";
import {
  createStylistAction,
  createStylistsBulkAction,
  toggleStylistActiveAction,
  updateStylistAction,
} from "@/app/admin/actions";
import { SALON_CODES, SALON_LABELS, salonLabel } from "@/lib/salons";
import type { AdminStylist } from "@/lib/admin-shared";

const inputClass =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-base text-ink";

export function StylistManager({
  adminKey,
  stylists,
}: {
  adminKey: string;
  stylists: AdminStylist[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startAction] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>, onOk?: () => void) => {
    startAction(async () => {
      const result = await fn();
      setToast(result.message);
      if (result.ok) {
        setEditingId(null);
        onOk?.();
        router.refresh();
      }
    });
  };

  const activeCount = stylists.filter((s) => s.isActive).length;
  // 店舗ごとの在籍人数。これが店舗賞の割り算の分母になる
  const countsBySalon = SALON_CODES.map((code) => ({
    code,
    count: stylists.filter((s) => s.isActive && s.salon === code).length,
  }));
  const noSalonCount = stylists.filter((s) => s.isActive && !s.salon).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-bold text-black/70">店舗賞の分母になる在籍人数</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-black/50">
          店舗賞は「合計いいね数 ÷ 所属スタッフ数」で決まります。
          その<strong className="text-black/70">所属スタッフ数がこの人数</strong>です。
          出品しないスタッフも登録しておくと、その人数で割られます。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {countsBySalon.map(({ code, count }) => (
            <span
              key={code}
              className="rounded-full bg-black/6 px-3.5 py-2 text-xs font-medium text-black/70"
            >
              {SALON_LABELS[code]} <strong className="text-sm">{count}</strong>人
            </span>
          ))}
          {noSalonCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3.5 py-2 text-xs font-medium text-amber-800">
              所属未設定 <strong className="text-sm">{noSalonCount}</strong>人（店舗賞に入りません）
            </span>
          )}
        </div>
      </section>

      <BulkAddForm adminKey={adminKey} busy={busy} onSubmit={run} />

      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="mb-3 text-sm font-bold text-black/70">1人ずつ追加する</h2>
        <form
          ref={formRef}
          action={(formData) =>
            run(() => createStylistAction(formData), () => formRef.current?.reset())
          }
          className="space-y-3"
        >
          <input type="hidden" name="key" value={adminKey} />
          <label className="block text-xs font-medium text-black/50">
            名前（必須）
            <input name="name" required placeholder="例：田中 美咲" className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-black/50">
            所属店舗
            <select name="salon" defaultValue="" className={inputClass}>
              <option value="">選択してください</option>
              {SALON_CODES.map((code) => (
                <option key={code} value={code}>
                  {SALON_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
          >
            {busy ? "処理中…" : "名簿に追加する"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-black/70">
          名簿（在籍 {activeCount}人 / 全 {stylists.length}人）
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-black/45">
          「休止」にすると写真の担当者の選択肢から外れ、店舗賞の分母にも入らなくなります。
          これまでの得票と、登録済みの写真はそのまま残ります。
        </p>

        <ul className="space-y-2">
          {stylists.map((stylist) => (
            <li key={stylist.id} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {stylist.name}
                    {!stylist.isActive && (
                      <span className="ml-1.5 rounded bg-black/8 px-1.5 py-0.5 text-[10px] text-black/50">
                        休止
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-black/45">
                    {stylist.salon ? salonLabel(stylist.salon) : "所属未設定"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => toggleStylistActiveAction(adminKey, stylist.id, !stylist.isActive))
                    }
                    className="rounded-lg bg-black/6 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                  >
                    {stylist.isActive ? "休止にする" : "在籍にもどす"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === stylist.id ? null : stylist.id)}
                    className="rounded-lg bg-black/6 px-3 py-1.5 text-xs font-medium"
                  >
                    {editingId === stylist.id ? "閉じる" : "編集"}
                  </button>
                </div>
              </div>

              {editingId === stylist.id && (
                <form
                  action={(formData) => run(() => updateStylistAction(formData))}
                  className="mt-4 space-y-3 border-t border-black/8 pt-4"
                >
                  <input type="hidden" name="key" value={adminKey} />
                  <input type="hidden" name="id" value={stylist.id} />
                  <label className="block text-xs font-medium text-black/50">
                    名前（必須）
                    <input
                      name="name"
                      required
                      defaultValue={stylist.name}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-black/50">
                    所属店舗
                    <select name="salon" defaultValue={stylist.salon ?? ""} className={inputClass}>
                      <option value="">選択してください</option>
                      {SALON_CODES.map((code) => (
                        <option key={code} value={code}>
                          {SALON_LABELS[code]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-accent py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
                  >
                    {busy ? "保存中…" : "保存する"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} durationMs={2600} />
    </div>
  );
}

/**
 * 名簿をまとめて登録するフォーム。
 * 店舗ごとに名前を貼り付けてもらう想定（所属店舗はその回の全員に付く）。
 */
function BulkAddForm({
  adminKey,
  busy,
  onSubmit,
}: {
  adminKey: string;
  busy: boolean;
  onSubmit: (fn: () => Promise<{ ok: boolean; message: string }>, onOk?: () => void) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <h2 className="text-sm font-bold text-black/70">名簿をまとめて登録する</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-black/50">
        名前を<strong className="text-black/70">1行に1人ずつ</strong>貼り付けてください。
        所属店舗は、この回に登録する全員に付きます。
        <strong className="text-black/70">店舗ごとに分けて</strong>登録してください。
        <br />
        すでに名簿にいる人は自動で飛ばすので、何度貼り付けても重複しません。
      </p>

      <form
        ref={formRef}
        action={(formData) =>
          onSubmit(() => createStylistsBulkAction(formData), () => formRef.current?.reset())
        }
        className="mt-3 space-y-3"
      >
        <input type="hidden" name="key" value={adminKey} />

        <label className="block text-xs font-medium text-black/50">
          所属店舗（この回に登録する全員に付きます）
          <select name="salon" defaultValue="" className={inputClass}>
            <option value="">選択してください（あとで個別に直せます）</option>
            {SALON_CODES.map((code) => (
              <option key={code} value={code}>
                {SALON_LABELS[code]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-black/50">
          名前（1行に1人）
          <textarea
            name="names"
            required
            rows={8}
            placeholder={"松本　尚弥\n大和田　玲円\n加地　葵"}
            className={`${inputClass} font-mono text-sm leading-relaxed`}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
        >
          {busy ? "登録中…" : "まとめて名簿に追加する"}
        </button>
      </form>
    </section>
  );
}
