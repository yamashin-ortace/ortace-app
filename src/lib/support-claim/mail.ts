import "server-only";

type SendSupportClaimMailParams = {
  to: string;
  subject: string;
  text: string;
};

export async function sendSupportClaimMail({
  to,
  subject,
  text,
}: SendSupportClaimMailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[support-claim] RESEND_API_KEY が未設定のためメール送信をスキップしました。");
    return false;
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ortace.jp";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `ORT ACE サポート <${fromEmail}>`,
      to: [to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[support-claim] Resend API error", response.status, detail);
    return false;
  }

  return true;
}

export function buildSupportClaimSubmittedAdminText(params: {
  claimId: string;
  userId: string;
  userEmail: string | null;
  userComment: string | null;
}) {
  return [
    "合格サポート保証の申請を受け付けました。",
    "",
    `申請ID: ${params.claimId}`,
    `ユーザーID: ${params.userId}`,
    `メール: ${params.userEmail ?? "未設定"}`,
    "",
    "--- コメント ---",
    params.userComment || "（なし）",
    "----------------",
    "",
    "管理画面で添付画像と利用履歴を確認してください。",
  ].join("\n");
}

export function buildSupportClaimApprovedText(expiresAtLabel: string) {
  return [
    "合格サポート保証の申請を承認しました。",
    "",
    `国試対策パックの利用期限を ${expiresAtLabel} まで延長しました。`,
    "引き続き ORT ACE を学習にご活用ください。",
  ].join("\n");
}

export function buildSupportClaimRejectedText(reason: string) {
  return [
    "合格サポート保証の申請を確認しましたが、今回は対象外として処理しました。",
    "",
    "--- 理由 ---",
    reason,
    "------------",
    "",
    "内容に心当たりがない場合は、ORT ACEのお問い合わせフォームからご連絡ください。",
  ].join("\n");
}
