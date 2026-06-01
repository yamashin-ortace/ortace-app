import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminUserId } from "@/lib/admin/access";
import {
  createAdminBasicAuthChallenge,
  hasValidAdminBasicAuth,
} from "@/lib/admin/basic-auth";
import { createSupabaseAdminClient } from "@/lib/billing/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateSupportClaimExtensionEndsAt } from "@/lib/support-claim/eligibility";
import {
  buildSupportClaimApprovedText,
  sendSupportClaimMail,
} from "@/lib/support-claim/mail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasValidAdminBasicAuth(request.headers.get("authorization"))) {
    return createAdminBasicAuthChallenge();
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUserId(user?.id)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
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

  const now = new Date();
  const reviewedAt = now.toISOString();
  const planExpiresAt = calculateSupportClaimExtensionEndsAt(now);
  const [{ error: claimUpdateError }, { error: profileUpdateError }] =
    await Promise.all([
      admin
        .from("support_claims")
        .update({
          status: "approved",
          reviewed_at: reviewedAt,
          reviewed_by: user!.id,
          reject_reason: null,
        })
        .eq("id", claim.id),
      admin
        .from("profiles")
        .update({
          plan: "exam",
          plan_status: "active",
          plan_expires_at: planExpiresAt,
          support_claim_used_at: reviewedAt,
          plan_updated_at: reviewedAt,
        })
        .eq("id", claim.user_id),
    ]);

  if (claimUpdateError || profileUpdateError) {
    return NextResponse.json(
      { error: "承認処理に失敗しました" },
      { status: 500 },
    );
  }

  const claimUser = await admin.auth.admin.getUserById(claim.user_id);
  const email = claimUser.data.user?.email;
  if (email) {
    void sendSupportClaimMail({
      to: email,
      subject: "[ORT ACE] 合格サポート保証を承認しました",
      text: buildSupportClaimApprovedText(formatDate(planExpiresAt)),
    }).catch((error) => {
      console.error("[support-claim] approval mail failed", error);
    });
  }

  revalidatePath("/admin/support-claims");
  revalidatePath("/support-claim");
  revalidatePath("/", "layout");

  return respond(request, { ok: true });
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
