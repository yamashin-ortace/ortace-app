import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import {
  DEVICE_TOKEN_COOKIE_NAME,
  MAX_ACTIVE_DEVICES,
  createDeviceToken,
  getDeviceLabel,
  isValidDeviceFingerprint,
  isValidDeviceToken,
  pickDevicesToRevoke,
  type ActiveDevice,
} from "@/lib/auth/device-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegisterDeviceBody = {
  deviceFingerprint?: unknown;
  userAgent?: unknown;
  deviceLabel?: unknown;
};

const DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RegisterDeviceBody | null;
  const rawDeviceFingerprint = body?.deviceFingerprint;
  const deviceFingerprint = isValidDeviceFingerprint(rawDeviceFingerprint)
    ? rawDeviceFingerprint
    : null;
  const cookieToken = request.cookies.get(DEVICE_TOKEN_COOKIE_NAME)?.value;
  const deviceToken = isValidDeviceToken(cookieToken)
    ? cookieToken
    : createDeviceToken();

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
    .eq("device_token", deviceToken)
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
  let currentDeviceId: string;

  if (existingDevice) {
    if (existingDevice.revoked_at) {
      const response = NextResponse.json(
        { error: "この端末はログアウトされました" },
        { status: 409 },
      );
      clearDeviceTokenCookie(response);
      return response;
    }

    currentDeviceId = existingDevice.id;
    const { error } = await admin
      .from("user_devices")
      .update({
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        device_label: deviceLabel,
        last_seen_at: now,
        revoked_by_device_fingerprint: null,
        revoked_by_device_token: null,
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
    const { data: insertedDevice, error } = await admin
      .from("user_devices")
      .insert({
        user_id: user.id,
        device_token: deviceToken,
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        device_label: deviceLabel,
        last_seen_at: now,
      })
      .select("id")
      .single();

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

    currentDeviceId = insertedDevice.id;
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
    currentDeviceId,
  );

  if (devicesToRevoke.length > 0) {
    const { error } = await admin
      .from("user_devices")
      .update({
        revoked_at: now,
        revoked_reason: "device_limit",
        revoked_by_device_fingerprint: deviceFingerprint,
        revoked_by_device_token: deviceToken,
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

  const response = NextResponse.json({
    ok: true,
    maxDevices: MAX_ACTIVE_DEVICES,
    currentDeviceId,
    revokedDeviceCount: devicesToRevoke.length,
    devices: activeDevices,
  });
  setDeviceTokenCookie(response, deviceToken);
  return response;
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

function setDeviceTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(DEVICE_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
}

function clearDeviceTokenCookie(response: NextResponse) {
  response.cookies.set(DEVICE_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
