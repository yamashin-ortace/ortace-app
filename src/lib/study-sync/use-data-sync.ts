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
  subscribers: number;
  run: (() => Promise<void>) | null;
  teardown: (() => void) | null;
};

const stateByKey = new Map<string, SyncState>();

function ensureState(key: string): SyncState {
  let state = stateByKey.get(key);
  if (!state) {
    state = {
      started: false,
      inFlight: false,
      subscribers: 0,
      run: null,
      teardown: null,
    };
    stateByKey.set(key, state);
  }
  return state;
}

async function triggerSync(state: SyncState) {
  if (state.inFlight || !state.run) return;
  state.inFlight = true;
  try {
    await state.run();
  } finally {
    state.inFlight = false;
  }
}

/**
 * データ同期トリガーを「一度しか走らない」から「適切な時点で再実行できる」に強化するフック。
 *
 * - 初回マウントで一度実行
 * - タブが visible に戻った時に再実行（別端末から戻った場合の同期に有効）
 * - window focus / online 復帰で再実行
 * - 表示中は短い間隔で再同期（同じアカウントの別端末操作を取り込む）
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
    state.run = run;
    state.subscribers += 1;

    if (!state.started) {
      state.started = true;
      void triggerSync(state);
    }

    if (!state.teardown) {
      const triggerIfVisible = () => {
        if (document.visibilityState === "visible") {
          void triggerSync(state);
        }
      };
      const handleVisibility = () => triggerIfVisible();
      const intervalId = window.setInterval(triggerIfVisible, 15_000);

      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", triggerIfVisible);
      window.addEventListener("online", triggerIfVisible);

      state.teardown = () => {
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", triggerIfVisible);
        window.removeEventListener("online", triggerIfVisible);
      };
    }

    return () => {
      state.subscribers = Math.max(0, state.subscribers - 1);
      if (state.subscribers === 0) {
        state.teardown?.();
        state.teardown = null;
        state.run = null;
        state.started = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key で識別し、run は呼び出し側で安定参照を渡す
  }, [key]);
}
