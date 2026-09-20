"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StyleFormFields } from "./style-form-fields";
import { Thumb } from "../thumb";
import { Toast } from "../toast";
import {
  createStyleAction,
  deleteSampleStylesAction,
  deleteStyleAction,
  hideSampleStylesAction,
  moveStyleAction,
  shuffleStylesAction,
  toggleActiveAction,
  updateStyleAction,
} from "@/app/admin/actions";
import { formatBytes, prepareImages } from "@/lib/image-resize";
import { salonLabel, type AdminStyle, type AdminStylist } from "@/lib/admin-shared";

export function StyleManager({
  adminKey,
  styles,
  stylists,
}: {
  adminKey: string;
  styles: AdminStyle[];
  /** 担当者のプルダウンに出す、在籍中のスタイリスト */
  stylists: AdminStylist[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // 削除の確認中の写真。うっかり消さないよう、2段階にしている
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, startAction] = useTransition();

  const notify = (message: string) => setToast(message);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    startAction(async () => {
      const result = await fn();
      notify(result.message);
      if (result.ok) {
        setEditingId(null);
        setDeletingId(null);
        router.refresh();
      }
    });
  };

  // 最初から入っているサンプル写真（外部サービス配信ぶん）
  const samples = styles.filter((s) => s.imageUrl.includes("picsum.photos"));
  const visibleSamples = samples.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {samples.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <h2 className="text-sm font-bold text-black/70">サンプル写真の片付け</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-black/50">
            最初から入っているサンプル写真が <strong>{samples.length}枚</strong> 登録されています
            （うち投票画面に出ているのは {visibleSamples}枚）。
            サンプルは外部の無料サービスから配信されているため表示が遅く、
            投票画面全体の読み込みを重くします。
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {visibleSamples > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => hideSampleStylesAction(adminKey))}
                className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
              >
                {busy ? "処理中…" : `${visibleSamples}枚 をまとめて非表示にする`}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deleteSampleStylesAction(adminKey))}
              className="rounded-full bg-black/8 px-6 py-3 text-sm font-bold text-black/70 active:scale-95 disabled:opacity-60"
            >
              {busy ? "処理中…" : `サンプル写真 ${samples.length}枚 をまとめて完全に削除する`}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-black/40">
            「非表示」は投票画面から隠すだけで、あとから戻せます。
            「完全に削除」は取り消せません。
          </p>
        </section>
      )}

      <AddStyleForm
        adminKey={adminKey}
        stylists={stylists}
        onDone={notify}
        onSaved={() => router.refresh()}
      />

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-black/70">
            登録済みのスタイル（{styles.length}件）
          </h2>
          <button
            type="button"
            disabled={busy || styles.length < 2}
            onClick={() => run(() => shuffleStylesAction(adminKey))}
            className="rounded-full bg-black/8 px-4 py-2 text-xs font-bold text-black/70 active:scale-95 disabled:opacity-40"
          >
            {busy ? "処理中…" : "並び順をランダムにする"}
          </button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-black/45">
          上の矢印で投票画面での並び順を変えられます。「非表示」にすると投票画面から消えますが、
          過去の得票数は残ります。
          <br />
          「削除」は写真も票も完全に消します（取り消せません）。
          票を残したいときは「非表示にする」を使ってください。
          <br />
          「並び順をランダムにする」は押すたびに並びが変わります。
          いつも同じ写真が上にあると票が集まりやすいので、ときどき混ぜ直すと結果が偏りにくくなります。
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
                    <button
                      type="button"
                      onClick={() => setDeletingId(deletingId === style.id ? null : style.id)}
                      className="rounded-lg bg-black/6 px-3 py-1.5 text-xs font-medium text-accent-dark"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>

              {deletingId === style.id && (
                <div className="mt-4 rounded-xl bg-accent/8 p-3">
                  <p className="text-xs leading-relaxed text-black/70">
                    <strong>「{style.title}」を完全に削除します。</strong>
                    <br />
                    {style.voteCount > 0 ? (
                      <>
                        この写真には
                        <strong className="text-accent-dark">{style.voteCount}票</strong>
                        入っています。削除するとその票も消え、ランキングの集計から外れます。
                        <br />
                        票を残したまま投票画面から消すだけなら「非表示にする」を使ってください。
                      </>
                    ) : (
                      <>まだ票は入っていません。</>
                    )}
                    <br />
                    この操作は取り消せません。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      disabled={busy}
                      className="flex-1 rounded-full bg-black/8 py-2.5 text-xs font-bold text-black/60 disabled:opacity-50"
                    >
                      やめる
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => deleteStyleAction(adminKey, style.id))}
                      disabled={busy}
                      className="flex-[1.4] rounded-full bg-accent py-2.5 text-xs font-bold text-white active:scale-95 disabled:opacity-60"
                    >
                      {busy ? "削除中…" : "完全に削除する"}
                    </button>
                  </div>
                </div>
              )}

              {editingId === style.id && (
                <form
                  action={(formData) => run(() => updateStyleAction(formData))}
                  className="mt-4 border-t border-black/8 pt-4"
                >
                  <input type="hidden" name="key" value={adminKey} />
                  <input type="hidden" name="id" value={style.id} />
                  <StyleFormFields style={style} stylists={stylists} />
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
  stylists,
  onDone,
  onSaved,
}: {
  adminKey: string;
  stylists: AdminStylist[];
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

        <StyleFormFields stylists={stylists} />

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
