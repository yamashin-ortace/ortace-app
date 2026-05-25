import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RevokeDeviceBody = {
  deviceId?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RevokeDeviceBody | null;
  const deviceId = body?.deviceId;

  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "端末IDが不正です" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: device, error: findError } = await admin
    .from("user_devices")
    .select("id,user_id,revoked_at")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError) {
    return NextResponse.json(
      { error: "端末情報の確認に失敗しました" },
      { status: 500 },
    );
  }

  if (!device || device.revoked_at) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await admin
    .from("user_devices")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: "manual",
    })
    .eq("id", device.id);

  if (error) {
    return NextResponse.json(
      { error: "端末のログアウトに失敗しました" },
      { status: 500 },
    );
  }

  revalidatePath("/settings");

  return NextResponse.json({ ok: true });
}
