"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StyleFormFields } from "./style-form-fields";
import { Thumb } from "../thumb";
import { Toast } from "../toast";
import {
  createStyleAction,
  moveStyleAction,
  toggleActiveAction,
  updateStyleAction,
} from "@/app/admin/actions";
import { formatBytes, prepareImages } from "@/lib/image-resize";
import { salonLabel, type AdminStyle } from "@/lib/admin-shared";

export function StyleManager({
  adminKey,
  styles,
}: {
  adminKey: string;
  styles: AdminStyle[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startAction] = useTransition();

  const notify = (message: string) => setToast(message);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    startAction(async () => {
      const result = await fn();
      notify(result.message);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <AddStyleForm adminKey={adminKey} onDone={notify} onSaved={() => router.refresh()} />

      <section>
        <h2 className="mb-2 text-sm font-bold text-black/70">
          登録済みのスタイル（{styles.length}件）
        </h2>
        <p className="mb-3 text-xs text-black/45">
          上の矢印で投票画面での並び順を変えられます。「非表示」にすると投票画面から消えますが、
          過去の得票数は残ります。
        </p>

        <ul className="space-y-2">
          {styles.map((style, index) => (
            <li key={style.id} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/5">
                  <Thumb style={style} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {style.title}
                    {!style.isActive && (
                      <span className="ml-1.5 rounded bg-black/8 px-1.5 py-0.5 text-[10px] text-black/50">
                        非表示
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-black/45">
                    {style.stylist ?? "担当なし"}
                    {" ・ "}
                    {salonLabel(style.salon)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() =>
                        run(() => moveStyleAction(adminKey, style.id, styles[index - 1].id))
                      }
                      className="rounded-lg bg-black/6 px-3 py-1.5 text-sm disabled:opacity-30"
                      aria-label="ひとつ前に移動"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === styles.length - 1}
                      onClick={() =>
                        run(() => moveStyleAction(adminKey, style.id, styles[index + 1].id))
                      }
                      className="rounded-lg bg-black/6 px-3 py-1.5 text-sm disabled:opacity-30"
                      aria-label="ひとつ後ろに移動"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(() => toggleActiveAction(adminKey, style.id, !style.isActive))
                      }
                      className="rounded-lg bg-black/6 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                    >
                      {style.isActive ? "非表示にする" : "表示にもどす"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === style.id ? null : style.id)}
                      className="rounded-lg bg-black/6 px-3 py-1.5 text-xs font-medium"
                    >
                      {editingId === style.id ? "閉じる" : "編集"}
                    </button>
                  </div>
                </div>
              </div>

              {editingId === style.id && (
                <form
                  action={(formData) => run(() => updateStyleAction(formData))}
                  className="mt-4 border-t border-black/8 pt-4"
                >
                  <input type="hidden" name="key" value={adminKey} />
                  <input type="hidden" name="id" value={style.id} />
                  <StyleFormFields style={style} />
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-4 w-full rounded-full bg-accent py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
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

/** 写真を新しく登録するフォーム */
function AddStyleForm({
  adminKey,
  onDone,
  onSaved,
}: {
  adminKey: string;
  onDone: (message: string) => void;
  onSaved: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sizeNote, setSizeNote] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "preparing" | "uploading">("idle");
  const preparedRef = useRef<{ full: File; thumb: File } | null>(null);

  const handleFile = async (file: File | undefined) => {
    preparedRef.current = null;
    setSizeNote(null);
    if (!file) {
      setPreview(null);
      return;
    }
    setStatus("preparing");
    try {
      const prepared = await prepareImages(file);
      preparedRef.current = { full: prepared.full, thumb: prepared.thumb };
      setPreview(URL.createObjectURL(prepared.thumb));
      setSizeNote(
        `${formatBytes(prepared.originalBytes)} → ${formatBytes(prepared.fullBytes)}に縮小しました`,
      );
    } catch {
      onDone("この写真は読み込めませんでした。別の写真をお試しください");
      setPreview(null);
    } finally {
      setStatus("idle");
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const prepared = preparedRef.current;
    if (!prepared) {
      onDone("写真を選んでください");
      return;
    }
    setStatus("uploading");
    // 元の大きい写真ではなく、縮小した2枚を送る
    formData.delete("picker");
    formData.set("image", prepared.full);
    formData.set("thumb", prepared.thumb);
    const result = await createStyleAction(formData);
    setStatus("idle");
    onDone(result.message);
    if (result.ok) {
      formRef.current?.reset();
      setPreview(null);
      setSizeNote(null);
      preparedRef.current = null;
      onSaved();
    }
  };

  const busy = status !== "idle";

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-black/70">写真を追加する</h2>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <input type="hidden" name="key" value={adminKey} />

        <label className="block text-xs font-medium text-black/50">
          写真（必須）
          <input
            type="file"
            name="picker"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="mt-1 block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-black/8 file:px-4 file:py-2.5 file:text-sm file:font-medium"
          />
        </label>

        {status === "preparing" && (
          <p className="text-xs text-black/45">写真を読み込んでいます…</p>
        )}

        {preview && (
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="選んだ写真" className="h-full w-full object-cover" />
            </div>
            <div className="text-xs text-black/45">
              <p>投票画面では、この正方形の見た目で表示されます</p>
              {sizeNote && <p className="mt-1 text-black/35">{sizeNote}</p>}
            </div>
          </div>
        )}

        <StyleFormFields />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
        >
          {status === "uploading" ? "登録中…" : "この写真を登録する"}
        </button>
      </form>
    </section>
  );
}
