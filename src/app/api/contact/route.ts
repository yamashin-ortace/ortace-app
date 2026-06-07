import { NextResponse } from "next/server";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  category?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
  attachment?: unknown;
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "問題・解説の不備",
  bug: "表示・動作の不具合",
  billing: "プラン・お支払い",
  feedback: "改善提案・ご要望",
  general: "その他のご質問やご依頼",
  other: "その他のご質問やご依頼",
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const MAX_ATTACHMENT_BASE64_LENGTH = Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 + 4;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
type ContactAttachment = {
  filename: string;
  content: string;
  content_type: string;
  size: number;
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
  const attachment = parseAttachment(body.attachment);

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
  if (attachment instanceof Response) return attachment;

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
    attachment
      ? `添付: ${attachment.filename} (${attachment.content_type}, ${formatBytes(
          attachment.size,
        )})`
      : `添付: なし`,
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
        attachments: attachment
          ? [
              {
                filename: attachment.filename,
                content: attachment.content,
                content_type: attachment.content_type,
              },
            ]
          : undefined,
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

function parseAttachment(value: unknown): ContactAttachment | null | Response {
  if (!value) return null;
  if (!isRecord(value)) {
    return NextResponse.json(
      { error: "添付画像の形式が不正です。" },
      { status: 400 },
    );
  }

  const filename = sanitizeFileName(sanitize(value.name, 160));
  const contentType = sanitize(value.type, 80);
  const content = sanitize(value.data, MAX_ATTACHMENT_BASE64_LENGTH + 1);
  const size = typeof value.size === "number" ? value.size : 0;

  if (!filename || !content || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "添付できる画像は PNG / JPEG / WebP のみです。" },
      { status: 400 },
    );
  }
  if (
    size <= 0 ||
    size > MAX_ATTACHMENT_BYTES ||
    content.length > MAX_ATTACHMENT_BASE64_LENGTH ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(content)
  ) {
    return NextResponse.json(
      { error: "添付画像は3MB以内にしてください。" },
      { status: 400 },
    );
  }

  return {
    filename,
    content,
    content_type: contentType,
    size,
  };
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.\-ぁ-んァ-ン一-龥ー]/g, "_").slice(0, 160);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value}B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)}KB`;
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
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
