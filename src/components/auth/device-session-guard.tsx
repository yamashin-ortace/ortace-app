"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  DEVICE_FINGERPRINT_STORAGE_KEY,
  DEVICE_REVOKED_NOTICE_KEY,
  createDeviceFingerprint,
  getDeviceFingerprintPayload,
  getDeviceLabel,
} from "@/lib/auth/device-limit";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
};

const DEVICE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function DeviceSessionGuard({ userId }: Props) {
  const isSigningOutRef = useRef(false);

  const handleRevokedDevice = useCallback(async () => {
    isSigningOutRef.current = true;
    try {
      window.localStorage.removeItem(DEVICE_FINGERPRINT_STORAGE_KEY);
      window.sessionStorage.setItem(DEVICE_REVOKED_NOTICE_KEY, "1");
    } catch {
      // storage が使えない環境でもサインアウトは継続する。
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/login?device=revoked");
  }, []);

  const registerDevice = useCallback(async () => {
    if (isSigningOutRef.current) return;

    try {
      const fingerprint = await createDeviceFingerprint();
      const payload = getDeviceFingerprintPayload();
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          userAgent: payload.userAgent,
          deviceLabel: getDeviceLabel(payload.userAgent),
        }),
      });

      if (response.status === 401) return;

      if (response.status === 409) {
        await handleRevokedDevice();
        return;
      }

      if (response.ok) {
        window.localStorage.setItem(DEVICE_FINGERPRINT_STORAGE_KEY, fingerprint);
      }
    } catch {
      // 端末登録に失敗しても学習画面自体は止めない。
    }
  }, [handleRevokedDevice]);

  useEffect(() => {
    void registerDevice();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void registerDevice();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(
      () => void registerDevice(),
      DEVICE_CHECK_INTERVAL_MS,
    );

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [registerDevice, userId]);

  return null;
}
