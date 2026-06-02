"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DIAGNOSTIC_STATUS_KEY,
  isDiagnosticStatus,
  type DiagnosticStatus,
} from "./diagnostic";
import {
  getAccountStorageKey,
  isCurrentAccountStorageKey,
} from "@/lib/auth/account-storage";

const CHANGE_EVENT = "ortace.diagnostic.changed";

function readStatus(): DiagnosticStatus {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(
    getAccountStorageKey(DIAGNOSTIC_STATUS_KEY),
  );
  if (raw === null) return null;
  if (raw === "completed" || raw === "skipped") return raw;
  return null;
}

let cached: DiagnosticStatus = readStatus();

function getSnapshot(): DiagnosticStatus {
  return cached;
}

function getServerSnapshot(): DiagnosticStatus {
  return null;
}

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handle = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      !isCurrentAccountStorageKey(event.key, DIAGNOSTIC_STATUS_KEY)
    ) {
      return;
    }
    cached = readStatus();
    listener();
  };
  window.addEventListener("storage", handle);
  window.addEventListener(CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(CHANGE_EVENT, handle);
  };
}

export function useDiagnosticStatus() {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setStatus = useCallback((next: DiagnosticStatus) => {
    if (typeof window === "undefined") return;
    if (!isDiagnosticStatus(next)) return;
    if (next === null) {
      window.localStorage.removeItem(getAccountStorageKey(DIAGNOSTIC_STATUS_KEY));
    } else {
      window.localStorage.setItem(getAccountStorageKey(DIAGNOSTIC_STATUS_KEY), next);
    }
    cached = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return { status, setStatus };
}
