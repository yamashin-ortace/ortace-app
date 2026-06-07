"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Paperclip,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const CATEGORIES = [
  { value: "content", label: "問題・解説の不備" },
  { value: "bug", label: "表示・動作の不具合" },
  { value: "billing", label: "プラン・お支払い" },
  { value: "feedback", label: "改善提案・ご要望" },
  { value: "general", label: "その他のご質問" },
  { value: "other", label: "その他" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];
type AttachmentPayload = {
  name: string;
  type: string;
  size: number;
  data: string;
};

const CATEGORY_GUIDES: Record<
  CategoryValue,
  { placeholder: string; helper: string }
> = {
  content: {
    placeholder:
      "例）第56回 午前 問12 の解説で「○○」とありますが、教科書では「△△」と理解しています。確認をお願いします。",
    helper:
      "問題番号、該当する選択肢や解説文、正しいと思う内容があると確認しやすくなります。",
  },
  bug: {
    placeholder:
      "例）学習タブで「復習する」を押すと読み込み中のまま止まります。再読み込みしても同じでした。",
    helper:
      "どの画面で、何を押したあと、どうなったかを書いてください。スクショがあると助かります。",
  },
  billing: {
    placeholder:
      "例）基礎定着パスを購入しましたが、マイページでは無料プランのまま表示されています。",
    helper:
      "購入したプラン、決済後の表示、確認したい内容を書いてください。カード番号は入力しないでください。",
  },
  feedback: {
    placeholder:
      "例）復習で、直近で間違えた問題だけを先に見られる切り替えがあると使いやすいです。",
    helper:
      "どんな場面で困ったか、どう変わると使いやすいかを書いてください。",
  },
  general: {
    placeholder:
      "例）無料プランと基礎定着パスで、解説を見られる範囲の違いを確認したいです。",
    helper: "使い方やプラン内容など、確認したいことを書いてください。",
  },
  other: {
    placeholder: "例）上記に当てはまらない内容ですが、確認をお願いします。",
    helper: "できるだけ具体的に状況を書いてください。",
  },
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

type Props = {
  /** Cloudflare Turnstile のサイトキー。未設定ならスパム対策チャレンジを省略 */
  turnstileSiteKey: string | null;
};

export function ContactForm({ turnstileSiteKey }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>(
    "content",
  );
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<AttachmentPayload | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (typeof window === "undefined") return;
    if (document.getElementById("cf-turnstile-script")) return;

    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (!turnstileContainerRef.current) return;
    // Turnstile widget は data-callback でトークンが取れる。
    // window.turnstile を経由してマウントできない場合は、HTMLの data-* 属性に任せる。
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "object" || event.data === null) return;
      const data = event.data as { type?: string; token?: string };
      if (data.type === "turnstile-token" && typeof data.token === "string") {
        setTurnstileToken(data.token);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [turnstileSiteKey]);

  const handleAttachmentChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setStatus({
        kind: "error",
        message: "添付できる画像は PNG / JPEG / WebP のみです。",
      });
      event.target.value = "";
      setAttachment(null);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setStatus({
        kind: "error",
        message: "添付画像は3MB以内にしてください。",
      });
      event.target.value = "";
      setAttachment(null);
      return;
    }

    try {
      const data = await readFileAsBase64(file);
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        data,
      });
      setStatus({ kind: "idle" });
    } catch {
      setStatus({
        kind: "error",
        message: "画像を読み込めませんでした。別の画像でお試しください。",
      });
      event.target.value = "";
      setAttachment(null);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status.kind === "submitting") return;

    if (!name.trim()) {
      setStatus({ kind: "error", message: "お名前を入力してください。" });
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setStatus({
        kind: "error",
        message: "正しい形式のメールアドレスを入力してください。",
      });
      return;
    }
    if (message.trim().length < 5) {
      setStatus({
        kind: "error",
        message: "お問い合わせ内容を5文字以上で入力してください。",
      });
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus({
        kind: "error",
        message: "スパム対策チャレンジを完了してください。",
      });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          turnstileToken,
          attachment,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          data?.error ??
            "送信に失敗しました。時間を置いて、もう一度お試しください。",
        );
      }
      setStatus({ kind: "success" });
      setName("");
      setEmail("");
      setCategory("content");
      setMessage("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "送信に失敗しました。時間を置いて、もう一度お試しください。",
      });
    }
  };

  if (status.kind === "success") {
    return (
      <div
        className="my-6 flex items-start gap-3 rounded-[14px] border border-[var(--success)]/40 bg-[var(--success)]/10 p-4"
        role="status"
      >
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]"
          strokeWidth={2.5}
        />
        <div>
          <p className="text-[14px] font-extrabold text-[var(--text-1)]">
            お問い合わせを受け付けました
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
            通常3営業日以内に、ご登録のメールアドレスへご返信します。
            お時間をいただく場合があることをご了承ください。
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = status.kind === "submitting";
  const selectedGuide = CATEGORY_GUIDES[category];

  return (
    <form onSubmit={submit} className="my-6 space-y-4" noValidate>
      <div>
        <label className="legal-form-label">
          お名前
          <span className="legal-form-required">必須</span>
        </label>
        <input
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
          className="legal-form-input"
          placeholder="山田 太郎"
        />
      </div>

      <div>
        <label className="legal-form-label">
          メールアドレス
          <span className="legal-form-required">必須</span>
        </label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="legal-form-input"
          placeholder="example@ortace.jp"
        />
      </div>

      <div>
        <label className="legal-form-label">お問い合わせ種別</label>
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as CategoryValue)
          }
          disabled={isSubmitting}
          className="legal-form-input"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="legal-form-label">
          お問い合わせ内容
          <span className="legal-form-required">必須</span>
        </label>
        <textarea
          required
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isSubmitting}
          className="legal-form-input"
          placeholder={selectedGuide.placeholder}
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-3)]">
          {selectedGuide.helper}
        </p>
      </div>

      <div>
        <label className="legal-form-label">画像添付（任意）</label>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-dashed border-border bg-[var(--bg-muted)]/35 px-3 py-3 text-[12px] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)]">
          <span className="flex min-w-0 items-center gap-2">
            <Paperclip
              className="h-4 w-4 shrink-0 text-[var(--primary-dark)]"
              strokeWidth={2.5}
            />
            <span className="min-w-0 truncate">
              {attachment
                ? attachment.name
                : "スクショを1枚添付できます（PNG / JPEG / WebP、3MB以内）"}
            </span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-[var(--primary-dark)]">
            選択
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isSubmitting}
            onChange={handleAttachmentChange}
            className="sr-only"
          />
        </label>
        {attachment ? (
          <button
            type="button"
            onClick={clearAttachment}
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-3)] hover:text-[var(--text-1)]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            添付を外す
          </button>
        ) : null}
      </div>

      {turnstileSiteKey ? (
        <div>
          <div
            ref={turnstileContainerRef}
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
          />
        </div>
      ) : null}

      {status.kind === "error" ? (
        <div
          className="flex items-start gap-2 rounded-[12px] border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 text-[12px] text-[var(--text-1)]"
          role="alert"
        >
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--error)]"
            strokeWidth={2.5}
          />
          <span>{status.message}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-[14px] font-extrabold text-white shadow-[0_8px_20px_var(--primary-shadow-soft)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            送信中…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={2.5} />
            送信する
          </>
        )}
      </button>
    </form>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = result.split(",");
      if (!base64) {
        reject(new Error("empty file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
