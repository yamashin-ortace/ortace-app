"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send, TriangleAlert } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const CATEGORIES = [
  { value: "general", label: "一般的なご質問" },
  { value: "billing", label: "プラン・お支払い" },
  { value: "bug", label: "不具合のご報告" },
  { value: "feedback", label: "ご要望・フィードバック" },
  { value: "other", label: "その他" },
] as const;

type Props = {
  /** Cloudflare Turnstile のサイトキー。未設定ならスパム対策チャレンジを省略 */
  turnstileSiteKey: string | null;
};

export function ContactForm({ turnstileSiteKey }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>(
    "general",
  );
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);

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
      setCategory("general");
      setMessage("");
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
            setCategory(event.target.value as (typeof CATEGORIES)[number]["value"])
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
          placeholder="具体的な状況・端末・ブラウザ等を添えていただくと、ご返信がスムーズです。"
        />
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
