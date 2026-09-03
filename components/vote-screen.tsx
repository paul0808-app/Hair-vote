"use client";

import { useCallback, useState } from "react";
import { BottomBar } from "./bottom-bar";
import { StyleCard } from "./style-card";
import { Toast } from "./toast";
import { useSelection } from "@/lib/use-selection";
import type { Style } from "@/lib/types";

export function VoteScreen({ styles }: { styles: Style[] }) {
  const { selectedIds, restored, toggle } = useSelection();
  const [toast, setToast] = useState<string | null>(null);

  const handleTap = useCallback(
    (style: Style) => {
      const result = toggle(style.id);
      if (result === "limit-reached") {
        setToast("最大5枚までです。他の選択を解除してください");
      }
    },
    [toggle],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <>
      <header className="mx-auto max-w-7xl px-3 pt-5 pb-3 text-center sm:px-6 sm:pt-8">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          好きなヘアスタイルを選んでください
        </h1>
        <p className="mt-1.5 text-sm text-black/55 sm:text-base">
          気になるスタイルを最大5枚までタップして選べます
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
                order={restored && position >= 0 ? position + 1 : null}
                onTap={handleTap}
                eager={index < 10}
              />
            );
          })}
        </div>

        <p className="py-8 text-center text-xs text-black/40">
          全 {styles.length} スタイル
        </p>
      </main>

      <Toast message={toast} onDismiss={dismissToast} />

      <BottomBar
        count={restored ? selectedIds.length : 0}
        onProceed={() => setToast("投票の確認画面はフェーズ2で作ります")}
      />
    </>
  );
}
