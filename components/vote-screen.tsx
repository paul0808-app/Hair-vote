"use client";

import { useCallback, useState, useTransition } from "react";
import { submitVote } from "@/app/actions";
import { BottomBar } from "./bottom-bar";
import { ConfirmDialog } from "./confirm-dialog";
import { PhotoModal } from "./photo-modal";
import { StyleCard } from "./style-card";
import { ThanksScreen } from "./thanks-screen";
import { Toast } from "./toast";
import { useVoteSession } from "@/lib/use-vote-session";
import type { Style } from "@/lib/types";

export function VoteScreen({
  styles,
  usingDummyData,
}: {
  styles: Style[];
  usingDummyData: boolean;
}) {
  const { ready, sessionId, seat, salon, selectedIds, status, toggle, markSubmitted, reset } =
    useVoteSession();
  const [toast, setToast] = useState<string | null>(null);
  // 保存中かどうか。確定ボタンの二度押しを防ぐ
  const [saving, startSaving] = useTransition();
  /** 拡大表示している写真の位置。null なら閉じている */
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 選んだ写真を「選択順」に並べ直したもの
  const selectedStyles = selectedIds
    .map((id) => styles.find((s) => s.id === id))
    .filter((s): s is Style => s !== undefined);

  const handleToggle = useCallback(
    (style: Style) => {
      if (toggle(style.id) === "limit-reached") {
        setToast("最大5枚までです。他の選択を解除してください");
      }
    },
    [toggle],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const handleConfirm = useCallback(() => {
    if (!sessionId) return;
    // ここが唯一のデータベース書き込み。お客様1人につき1回だけ実行される
    startSaving(async () => {
      const result = await submitVote({ sessionId, seat, salon, styleIds: selectedIds });
      if (!result.ok) {
        setToast(result.message);
        return;
      }
      setConfirmOpen(false);
      markSubmitted();
      window.scrollTo({ top: 0 });
    });
  }, [sessionId, seat, salon, selectedIds, markSubmitted]);

  // 投票が確定していたら、完了画面に切り替える
  if (ready && status === "submitted") {
    return <ThanksScreen selected={selectedStyles} onReset={reset} />;
  }

  return (
    <>
      <header className="mx-auto max-w-7xl px-3 pt-5 pb-3 text-center sm:px-6 sm:pt-8">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          好きなヘアスタイルを選んでください
        </h1>
        <p className="mt-1.5 text-sm text-black/55 sm:text-base">
          写真をタップすると大きく見られます。最大5枚まで「いいね」できます
        </p>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6">
        {/* 写真グリッド：スマホ3列／タブレット4列／iPad横5列 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 lg:gap-4">
          {styles.map((style, index) => {
            const position = selectedIds.indexOf(style.id);
            return (
              <StyleCard
                key={style.id}
                style={style}
                // 復元が終わるまでは未選択として描画し、表示のちらつきを防ぐ
                order={ready && position >= 0 ? position + 1 : null}
                onOpen={() => setModalIndex(index)}
                eager={index < 10}
              />
            );
          })}
        </div>

        {/* 下部の固定バーに最後の行が隠れないよう、バーの高さぶんの余白を空ける */}
        <p
          className="pt-8 text-center text-xs text-black/40"
          style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
        >
          全 {styles.length} スタイル
          {/* データベースにつながっていないときだけ出る、スタッフ向けの目印 */}
          {usingDummyData && <span className="ml-1 text-black/30">（仮データ）</span>}
        </p>
      </main>

      <PhotoModal
        styles={styles}
        index={modalIndex}
        order={
          modalIndex === null
            ? null
            : (() => {
                const p = selectedIds.indexOf(styles[modalIndex].id);
                return p >= 0 ? p + 1 : null;
              })()
        }
        onClose={() => setModalIndex(null)}
        onMove={setModalIndex}
        onToggle={handleToggle}
      />

      <ConfirmDialog
        open={confirmOpen}
        selected={selectedStyles}
        saving={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      <Toast message={toast} onDismiss={dismissToast} />

      <BottomBar
        count={ready ? selectedIds.length : 0}
        onProceed={() => setConfirmOpen(true)}
      />
    </>
  );
}
