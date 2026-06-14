import { describe, expect, it } from "vitest";
import {
  getDeviceLabel,
  isValidDeviceToken,
  pickDevicesToRevoke,
  type ActiveDevice,
} from "./device-limit";

describe("device-limit", () => {
  it("User-Agent から端末ラベルを作る", () => {
    expect(
      getDeviceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari on iPhone");
    expect(
      getDeviceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome on Mac");
  });

  it("4台目では現在端末以外の最古端末を無効化対象にする", () => {
    const devices = [
      device("old", "2026-05-01T00:00:00.000Z"),
      device("middle", "2026-05-02T00:00:00.000Z"),
      device("current", "2026-05-03T00:00:00.000Z"),
      device("new", "2026-05-04T00:00:00.000Z"),
    ];

    expect(pickDevicesToRevoke(devices, "new").map((item) => item.id)).toEqual([
      "old",
    ]);
  });

  it("現在端末の判定にクライアント生成fingerprintを使わない", () => {
    const devices = [
      device("current", "2026-05-01T00:00:00.000Z", "shared"),
      device("old", "2026-05-02T00:00:00.000Z", "shared"),
      device("middle", "2026-05-03T00:00:00.000Z", "middle"),
      device("new", "2026-05-04T00:00:00.000Z", "new"),
    ];

    expect(
      pickDevicesToRevoke(devices, "current").map((item) => item.id),
    ).toEqual(["old"]);
  });

  it("サーバー発行端末tokenはUUIDだけを受け入れる", () => {
    expect(isValidDeviceToken("8f7c0a40-6f5e-4a7b-8c08-5a3f4e11d7c0")).toBe(
      true,
    );
    expect(isValidDeviceToken("shared-client-fingerprint")).toBe(false);
  });
});

function device(
  id: string,
  lastSeenAt: string,
  fingerprint = id,
): ActiveDevice {
  return {
    id,
    device_fingerprint: fingerprint,
    device_label: id,
    user_agent: null,
    last_seen_at: lastSeenAt,
    created_at: lastSeenAt,
  };
}
