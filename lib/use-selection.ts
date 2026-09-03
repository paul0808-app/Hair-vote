"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_SELECTION } from "./types";

const STORAGE_KEY = "hairvote:selection:v1";

/** 選択に失敗した理由。画面側でトースト表示に使う */
export type SelectResult = "selected" | "unselected" | "limit-reached";

/**
 * 「どの写真を、どの順番で選んでいるか」を管理する仕組み。
 * ・選択中はデータベースには一切書き込まない（同時接続対策）
 * ・localStorage（ブラウザ内の保存領域）に保存し、閉じても復元できる
 */
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // localStorage はブラウザにしか無いので、読み込みが終わるまでは描画を待つ
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSelectedIds(
            parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_SELECTION),
          );
        }
      }
    } catch {
      // 保存内容が壊れていても、投票そのものは続けられるようにする
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // プライベートブラウズなどで保存できなくても無視する
    }
  }, [selectedIds, restored]);

  const toggle = useCallback(
    (id: string): SelectResult => {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((x) => x !== id));
        return "unselected";
      }
      if (selectedIds.length >= MAX_SELECTION) {
        // 上限に達している。エラーにはせず、画面側でお知らせを出す
        return "limit-reached";
      }
      setSelectedIds([...selectedIds, id]);
      return "selected";
    },
    [selectedIds],
  );

  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, restored, toggle, clear };
}
