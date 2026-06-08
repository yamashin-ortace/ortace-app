import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import {
  MAX_ACTIVE_DEVICES,
  getDeviceLabel,
  isValidDeviceFingerprint,
  pickDevicesToRevoke,
  type ActiveDevice,
} from "@/lib/auth/device-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegisterDeviceBody = {
  deviceFingerprint?: unknown;
  userAgent?: unknown;
  deviceLabel?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RegisterDeviceBody | null;
  const deviceFingerprint = body?.deviceFingerprint;

  if (!isValidDeviceFingerprint(deviceFingerprint)) {
    return NextResponse.json({ error: "端末情報が不正です" }, { status: 400 });
  }

  const userAgent =
    typeof body?.userAgent === "string" ? body.userAgent.slice(0, 500) : "";
  const deviceLabel =
    typeof body?.deviceLabel === "string" && body.deviceLabel.trim()
      ? body.deviceLabel.trim().slice(0, 80)
      : getDeviceLabel(userAgent);

  const admin = createSupabaseAdminClient();
  const { data: existingDevice, error: existingError } = await admin
    .from("user_devices")
    .select("*")
    .eq("user_id", user.id)
    .eq("device_fingerprint", deviceFingerprint)
    .maybeSingle();

  if (existingError) {
    console.error("[devices/register] failed to find existing device", {
      code: existingError.code,
      message: existingError.message,
      details: existingError.details,
      hint: existingError.hint,
    });
    return NextResponse.json(
      { error: "端末情報の確認に失敗しました" },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();

  if (existingDevice) {
    const { error } = await admin
      .from("user_devices")
      .update({
        user_agent: userAgent,
        device_label: deviceLabel,
        last_seen_at: now,
        revoked_at: null,
        revoked_reason: null,
        revoked_by_device_fingerprint: null,
      })
      .eq("id", existingDevice.id);

    if (error) {
      console.error("[devices/register] failed to update device", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "端末情報の更新に失敗しました" },
        { status: 500 },
      );
    }
  } else {
    const { error } = await admin.from("user_devices").insert({
      user_id: user.id,
      device_fingerprint: deviceFingerprint,
      user_agent: userAgent,
      device_label: deviceLabel,
      last_seen_at: now,
    });

    if (error) {
      console.error("[devices/register] failed to insert device", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "端末情報の登録に失敗しました" },
        { status: 500 },
      );
    }
  }

  let activeDevices = await getActiveDevices(user.id).catch(() => null);
  if (!activeDevices) {
    return NextResponse.json(
      { error: "端末一覧の取得に失敗しました" },
      { status: 500 },
    );
  }

  const devicesToRevoke = pickDevicesToRevoke(
    activeDevices,
    deviceFingerprint,
  );

  if (devicesToRevoke.length > 0) {
    const { error } = await admin
      .from("user_devices")
      .update({
        revoked_at: now,
        revoked_reason: "device_limit",
        revoked_by_device_fingerprint: deviceFingerprint,
      })
      .in(
        "id",
        devicesToRevoke.map((device) => device.id),
      );

    if (error) {
      console.error("[devices/register] failed to revoke old devices", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "古い端末の切断に失敗しました" },
        { status: 500 },
      );
    }

    activeDevices = await getActiveDevices(user.id).catch(() => null);
    if (!activeDevices) {
      return NextResponse.json(
        { error: "端末一覧の取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    maxDevices: MAX_ACTIVE_DEVICES,
    revokedDeviceCount: devicesToRevoke.length,
    devices: activeDevices,
  });
}

async function getActiveDevices(userId: string): Promise<ActiveDevice[]> {
  const { data, error } = await createSupabaseAdminClient()
    .from("user_devices")
    .select(
      "id,device_fingerprint,device_label,user_agent,last_seen_at,created_at",
    )
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });

  if (error) {
    console.error("[devices/register] failed to list active devices", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to list active devices: ${error.message}`);
  }

  return data ?? [];
}
