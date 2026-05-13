"use client";

import { useEffect } from "react";

/**
 * モジュール内同期状態。
 * - `started`：初回マウントで一度走らせたかどうか
 * - `inFlight`：現在同期処理中か（並走防止）
 */
type SyncState = {
  started: boolean;
  inFlight: boolean;
};

const stateByKey = new Map<string, SyncState>();

function ensureState(key: string): SyncState {
  let state = stateByKey.get(key);
  if (!state) {
    state = { started: false, inFlight: false };
    stateByKey.set(key, state);
  }
  return state;
}

/**
 * データ同期トリガーを「一度しか走らない」から「適切な時点で再実行できる」に強化するフック。
 *
 * - 初回マウントで一度実行
 * - タブが visible に戻った時に再実行（別端末から戻った場合の同期に有効）
 * - 在中の同期がある間は重複起動を抑制
 *
 * 同期処理本体（`run`）の中で失敗時に何もしない作りでも、次の visibility 変化で
 * 自動的にリトライ機会が生まれる。
 *
 * `key` はモジュール内で一意にする（同じ key を別フックで使うと共有される）。
 */
export function useDataSync(params: {
  key: string;
  run: () => Promise<void>;
}) {
  const { key, run } = params;

  useEffect(() => {
    const state = ensureState(key);

    const trigger = async () => {
      if (state.inFlight) return;
      state.inFlight = true;
      try {
        await run();
      } finally {
        state.inFlight = false;
      }
    };

    if (!state.started) {
      state.started = true;
      void trigger();
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void trigger();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key で識別し、run は呼び出し側で安定参照を渡す
  }, [key]);
}
