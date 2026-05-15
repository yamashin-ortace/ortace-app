import { NextResponse } from "next/server";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  category?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "一般的なご質問",
  billing: "プラン・お支払い",
  bug: "不具合のご報告",
  feedback: "ご要望・フィードバック",
  other: "その他",
};

/**
 * 問い合わせフォームの送信先。
 *
 * 必要な環境変数:
 * - RESEND_API_KEY: Resend で送信する場合に必須。未設定なら受信できない。
 * - CONTACT_FROM_EMAIL: 送信元（既定: noreply@ortace.jp）
 * - CONTACT_TO_EMAIL: 送信先（既定: info@ortace.jp）
 * - TURNSTILE_SECRET_KEY: Cloudflare Turnstile で検証する場合のみ必須
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ContactPayload | null;
  if (!body) {
    return NextResponse.json(
      { error: "リクエストの形式が不正です。" },
      { status: 400 },
    );
  }

  const name = sanitize(body.name, 80);
  const email = sanitize(body.email, 254);
  const category = sanitize(body.category, 24);
  const message = sanitize(body.message, 4000);
  const turnstileToken = sanitize(body.turnstileToken, 2048);

  if (!name) {
    return NextResponse.json(
      { error: "お名前を入力してください。" },
      { status: 400 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "正しい形式のメールアドレスを入力してください。" },
      { status: 400 },
    );
  }
  if (!message || message.length < 5) {
    return NextResponse.json(
      { error: "お問い合わせ内容を5文字以上で入力してください。" },
      { status: 400 },
    );
  }

  // Cloudflare Turnstile 検証（設定時のみ）
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "スパム対策チャレンジを完了してください。" },
        { status: 400 },
      );
    }
    const verified = await verifyTurnstile(turnstileSecret, turnstileToken);
    if (!verified) {
      return NextResponse.json(
        { error: "スパム対策チャレンジに失敗しました。再度お試しください。" },
        { status: 400 },
      );
    }
  }

  // Resend でメール送信
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // メール送信先が設定されていない場合、サーバーログに残して 503 を返す。
    // 受信が動かない状態でユーザーに「送信成功」と返すのは誤誘導になるため。
    console.error(
      "[contact] RESEND_API_KEY が未設定のため、メール送信ができません。",
    );
    return NextResponse.json(
      {
        error:
          "現在お問い合わせを受け付けられない設定になっています。お手数ですが直接 info@ortace.jp までご連絡ください。",
      },
      { status: 503 },
    );
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ortace.jp";
  const toEmail = process.env.CONTACT_TO_EMAIL ?? "info@ortace.jp";
  const categoryLabel = CATEGORY_LABELS[category] ?? "（その他）";

  const subject = `[ORT ACE 問い合わせ / ${categoryLabel}] ${name} 様より`;
  const textBody = [
    `お問い合わせを受け付けました。`,
    ``,
    `お名前: ${name}`,
    `メール: ${email}`,
    `種別: ${categoryLabel}`,
    `送信日時: ${new Date().toISOString()}`,
    ``,
    `--- 本文 ---`,
    message,
    `------------`,
    ``,
    `※このメールは ORT ACE 問い合わせフォームから自動送信されています。`,
    `返信は ${email} 宛にお送りください。`,
  ].join("\n");

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ORT ACE 問い合わせ <${fromEmail}>`,
        to: [toEmail],
        reply_to: email,
        subject,
        text: textBody,
      }),
    });
    if (!resendResponse.ok) {
      const detail = await resendResponse.text().catch(() => "");
      console.error("[contact] Resend API error", resendResponse.status, detail);
      return NextResponse.json(
        {
          error:
            "送信に失敗しました。時間を置いて、もう一度お試しください。",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[contact] Failed to call Resend", error);
    return NextResponse.json(
      {
        error: "送信に失敗しました。時間を置いて、もう一度お試しください。",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

function sanitize(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function verifyTurnstile(secret: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
      },
    );
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[contact] Turnstile verify failed", error);
    return false;
  }
}
