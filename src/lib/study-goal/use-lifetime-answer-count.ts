"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  LIFETIME_ANSWER_UPDATED_EVENT,
  readLifetimeAnswerCount,
} from "./lifetime-answer-count";

/** 解答のたびに更新されるべきときに購読 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handle = () => onChange();

  window.addEventListener(LIFETIME_ANSWER_UPDATED_EVENT, handle);
  window.addEventListener("storage", handle);

  return () => {
    window.removeEventListener(LIFETIME_ANSWER_UPDATED_EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

function snapshot(): number {
  if (typeof window === "undefined") return 0;
  return readLifetimeAnswerCount();
}

export function useLifetimeAnswerCount() {
  const count = useSyncExternalStore(subscribe, snapshot, () => 0);
  return useMemo(() => ({ count }), [count]);
}
