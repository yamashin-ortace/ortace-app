import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminUserId } from "@/lib/admin/access";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildSupportClaimRejectedText,
  sendSupportClaimMail,
} from "@/lib/support-claim/mail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUserId(user?.id)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const reason = await readRejectReason(request);
  if (!reason) {
    return NextResponse.json(
      { error: "却下理由を入力してください" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: claim, error: claimError } = await admin
    .from("support_claims")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (claimError || !claim) {
    return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return respond(request, { error: "確認待ちの申請ではありません" }, 409);
  }

  const { error } = await admin
    .from("support_claims")
    .update({
      status: "rejected",
      reject_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
    })
    .eq("id", claim.id);

  if (error) {
    return NextResponse.json(
      { error: "却下処理に失敗しました" },
      { status: 500 },
    );
  }

  const claimUser = await admin.auth.admin.getUserById(claim.user_id);
  const email = claimUser.data.user?.email;
  if (email) {
    void sendSupportClaimMail({
      to: email,
      subject: "[ORT ACE] 合格サポート保証の確認結果",
      text: buildSupportClaimRejectedText(reason),
    }).catch((error) => {
      console.error("[support-claim] rejection mail failed", error);
    });
  }

  revalidatePath("/admin/support-claims");
  revalidatePath("/support-claim");

  return respond(request, { ok: true });
}

async function readRejectReason(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | { reason?: unknown }
      | null;
    return sanitizeReason(body?.reason);
  }
  const formData = await request.formData().catch(() => null);
  return sanitizeReason(formData?.get("reason"));
}

function sanitizeReason(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 800);
}

function respond(
  request: Request,
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json(body, { status });
  }
  return NextResponse.redirect(new URL("/admin/support-claims", request.url), {
    status: 303,
  });
}
