"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_ACTIVE_DEVICES,
  createDeviceFingerprint,
  getDeviceFingerprintPayload,
  getDeviceLabel,
  type ActiveDevice,
} from "@/lib/auth/device-limit";

type Props = {
  devices: ActiveDevice[];
};

type RegisterDeviceResponse = {
  error?: string;
  currentDeviceId?: string;
  devices?: ActiveDevice[];
};

export function ActiveDevices({ devices }: Props) {
  const [items, setItems] = useState(devices);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncCurrentDevice = useCallback(async () => {
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
      const data = (await response.json().catch(() => null)) as
        | RegisterDeviceResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "端末情報を登録できませんでした");
      }

      if (data?.currentDeviceId) {
        setCurrentDeviceId(data.currentDeviceId);
      }

      if (data?.devices) {
        setItems(data.devices);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "端末情報を登録できませんでした",
      );
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void syncCurrentDevice();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [syncCurrentDevice]);

  const activeCountLabel = useMemo(
    () => `${items.length}/${MAX_ACTIVE_DEVICES}端末`,
    [items.length],
  );

  async function revokeDevice(deviceId: string) {
    setRevokingId(deviceId);
    setError(null);

    try {
      const response = await fetch("/api/devices/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "端末をログアウトできませんでした");
      }

      setItems((current) => current.filter((device) => device.id !== deviceId));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "端末をログアウトできませんでした",
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-[12px] border border-border bg-[var(--bg-muted)] px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-4 w-4 text-[var(--primary-dark)]"
            strokeWidth={2.5}
          />
          <span className="text-[12px] font-bold text-[var(--text-1)]">
            最大{MAX_ACTIVE_DEVICES}端末まで
          </span>
        </div>
        <span className="text-[12px] font-semibold text-[var(--text-3)]">
          {activeCountLabel}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-[12px] border border-border bg-[var(--bg-muted)] px-3 py-3 text-[12px] leading-relaxed text-[var(--text-3)]">
          {isSyncing
            ? "端末情報を確認しています。"
            : "端末情報を表示できませんでした。少し待ってからページを更新してください。"}
        </p>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border">
          {items.map((device) => {
            const isCurrent = Boolean(currentDeviceId) && device.id === currentDeviceId;
            return (
              <div
                key={device.id}
                className="flex items-center gap-3 border-b border-border/70 bg-[var(--bg-card)] px-3 py-3 last:border-b-0"
              >
                <MonitorSmartphone
                  className="h-4 w-4 shrink-0 text-[var(--text-3)]"
                  strokeWidth={2.5}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--text-1)]">
                    {device.device_label ?? "登録端末"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-3)]">
                    最終アクセス: {formatRelativeTime(device.last_seen_at)}
                  </p>
                </div>

                {isCurrent ? (
                  <span className="shrink-0 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-bold text-[var(--primary-dark)]">
                    現在の端末
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingId === device.id}
                    onClick={() => void revokeDevice(device.id)}
                    className="shrink-0 gap-1.5"
                  >
                    {revokingId === device.id ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    ログアウト
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="rounded-[10px] bg-destructive/10 px-3 py-2 text-[12px] leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}
