"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseSalonCode } from "./salons";
import { MAX_SELECTION, SESSION_EXPIRY_MS, type BallotStatus } from "./types";

const STORAGE_KEY = "hairvote:session:v1";

/** 選択操作の結果。画面側でお知らせ（トースト）を出すかどうかの判断に使う */
export type SelectResult = "selected" | "unselected" | "limit-reached";

/** ブラウザに保存しておく投票セッションの中身 */
type SessionState = {
  /** このタブレット・この回の投票を見分けるID */
  sessionId: string;
  /** 席番号（URLに ?seat=A1 と付いていれば入る） */
  seat: string | null;
  /** 店舗（URLに ?salon=PAUL のように付いていれば入る） */
  salon: string | null;
  /** 選んだ写真のID。並び順がそのまま選択順（1〜5番）になる */
  selectedIds: string[];
  status: BallotStatus;
  /** 投票を確定した時刻（ミリ秒）。30分の判定に使う */
  submittedAt: number | null;
};

function createSession(seat: string | null, salon: string | null): SessionState {
  return {
    sessionId: crypto.randomUUID(),
    seat,
    salon,
    selectedIds: [],
    status: "draft",
    submittedAt: null,
  };
}

/** URLの ?salon= は、決められた店舗コードのときだけ受け付ける */
function parseSalon(value: string | null): string | null {
  return parseSalonCode(value);
}

/** 保存されていた内容が壊れていないかを確かめる */
function parseSession(raw: string): SessionState | null {
  try {
    const v = JSON.parse(raw) as Partial<SessionState>;
    if (typeof v?.sessionId !== "string") return null;
    return {
      sessionId: v.sessionId,
      seat: typeof v.seat === "string" ? v.seat : null,
      salon: typeof v.salon === "string" ? v.salon : null,
      selectedIds: Array.isArray(v.selectedIds)
        ? v.selectedIds.filter((x): x is string => typeof x === "string").slice(0, MAX_SELECTION)
        : [],
      status: v.status === "submitted" ? "submitted" : "draft",
      submittedAt: typeof v.submittedAt === "number" ? v.submittedAt : null,
    };
  } catch {
    return null;
  }
}

/** 確定から30分以上たっていたら、そのセッションは終わったものとみなす */
function isExpired(s: SessionState): boolean {
  return s.status === "submitted" && s.submittedAt !== null && Date.now() - s.submittedAt > SESSION_EXPIRY_MS;
}

/**
 * 1人のお客様ぶんの投票（＝1セッション）を管理する仕組み。
 *
 * 大事な設計：選んでいる間はデータベースに一切書き込まず、
 * ブラウザの中（React の状態と localStorage）だけで管理する。
 * こうすることで、何席から同時に使われても書き込みがぶつからない。
 */
export function useVoteSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const seatRef = useRef<string | null>(null);
  const salonRef = useRef<string | null>(null);

  // 最初の1回だけ：URLの席番号・店舗を読み、保存済みセッションを復元する
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seat = params.get("seat");
    const salon = parseSalon(params.get("salon"));
    seatRef.current = seat;
    salonRef.current = salon;

    let restored: SessionState | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) restored = parseSession(raw);
    } catch {
      // 保存領域が使えなくても投票そのものは続けられるようにする
    }

    if (!restored || isExpired(restored)) {
      setSession(createSession(seat, salon));
      return;
    }
    // URLの席番号・店舗が指定されていれば、そちらを優先する
    setSession({
      ...restored,
      seat: seat ?? restored.seat,
      salon: salon ?? restored.salon,
    });
  }, []);

  // 状態が変わるたびにブラウザへ保存する（閉じても復元できるように）
  useEffect(() => {
    if (!session) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // プライベートブラウズなどで保存できない場合は何もしない
    }
  }, [session]);

  // 投票確定から30分たったら、自動的に次のお客様用にリセットする
  useEffect(() => {
    if (session?.status !== "submitted" || session.submittedAt === null) return;
    const remaining = session.submittedAt + SESSION_EXPIRY_MS - Date.now();
    const timer = setTimeout(
      () => setSession(createSession(seatRef.current, salonRef.current)),
      Math.max(remaining, 0),
    );
    return () => clearTimeout(timer);
  }, [session?.status, session?.submittedAt]);

  const toggle = useCallback(
    (id: string): SelectResult => {
      // 投票確定後は読み取り専用。変更も追加投票もできない
      if (!session || session.status === "submitted") return "limit-reached";

      if (session.selectedIds.includes(id)) {
        setSession({ ...session, selectedIds: session.selectedIds.filter((x) => x !== id) });
        return "unselected";
      }
      if (session.selectedIds.length >= MAX_SELECTION) return "limit-reached";
      setSession({ ...session, selectedIds: [...session.selectedIds, id] });
      return "selected";
    },
    [session],
  );

  /** 投票を確定済みにする（データベースへの保存が成功したあとに呼ぶ） */
  const markSubmitted = useCallback(() => {
    setSession((prev) =>
      prev && prev.status === "draft"
        ? { ...prev, status: "submitted", submittedAt: Date.now() }
        : prev,
    );
  }, []);

  /** 「次のお客様へ」。今のセッションを捨てて、新しい投票を最初から始める */
  const reset = useCallback(() => {
    setSession(createSession(seatRef.current, salonRef.current));
  }, []);

  return {
    // localStorage はブラウザにしか無いので、読み込みが終わるまでは null
    session,
    ready: session !== null,
    sessionId: session?.sessionId ?? null,
    seat: session?.seat ?? null,
    salon: session?.salon ?? null,
    selectedIds: session?.selectedIds ?? [],
    status: session?.status ?? "draft",
    toggle,
    markSubmitted,
    reset,
  };
}
