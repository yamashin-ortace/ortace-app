import type { UserDevicesRow } from "@/lib/supabase/database.types";

export const MAX_ACTIVE_DEVICES = 3;
export const DEVICE_FINGERPRINT_STORAGE_KEY = "ortace.deviceFingerprint";
export const DEVICE_REVOKED_NOTICE_KEY = "ortace.deviceRevokedNotice";

export type ActiveDevice = Pick<
  UserDevicesRow,
  | "id"
  | "device_fingerprint"
  | "device_label"
  | "user_agent"
  | "last_seen_at"
  | "created_at"
>;

export type DeviceFingerprintPayload = {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timeZone: string;
};

export async function createDeviceFingerprint(): Promise<string> {
  const payload = getDeviceFingerprintPayload();
  const source = [
    payload.userAgent,
    `${payload.screenWidth}x${payload.screenHeight}`,
    payload.language,
    payload.timeZone,
  ].join("|");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getDeviceFingerprintPayload(): DeviceFingerprintPayload {
  if (typeof window === "undefined") {
    return {
      userAgent: "",
      screenWidth: 0,
      screenHeight: 0,
      language: "",
      timeZone: "",
    };
  }

  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function getDeviceLabel(userAgent: string): string {
  const browser = getBrowserName(userAgent);
  const platform = getPlatformName(userAgent);
  return `${browser} on ${platform}`;
}

export function isValidDeviceFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function pickDevicesToRevoke(
  devices: ActiveDevice[],
  currentFingerprint: string,
): ActiveDevice[] {
  const overflow = devices.length - MAX_ACTIVE_DEVICES;
  if (overflow <= 0) return [];

  return [...devices]
    .filter((device) => device.device_fingerprint !== currentFingerprint)
    .sort(
      (a, b) =>
        new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime(),
    )
    .slice(0, overflow);
}

function getBrowserName(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/CriOS|Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) {
    return "Chrome";
  }
  if (/FxiOS|Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "Browser";
}

function getPlatformName(userAgent: string): string {
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) return "Android";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac";
  if (/Windows/.test(userAgent)) return "Windows";
  return "Device";
}
