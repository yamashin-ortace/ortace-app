"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  sendMagicLinkAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/lib/auth/actions";
import { GoogleIcon } from "@/components/auth/google-icon";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";

type EmailMode = "login" | "signup" | "magic";

interface LoginCardProps {
  initialError?: string;
  initialSent?: string;
}

export function LoginCard({ initialError, initialSent }: LoginCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(
    initialSent === "magic"
      ? "ログイン用リンクをメールで送信しました。受信トレイをご確認ください。"
      : initialSent === "signup"
        ? "確認メールを送信しました。メール内のリンクから登録を完了してください。"
        : null,
  );

  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGooglePending(false);
      setError(error.message);
    }
  }

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email) {
      setError("メールアドレスを入力してください。");
      return;
    }
    if (emailMode !== "magic") {
      const strength = validatePassword(password);
      if (strength) {
        setError(strength);
        return;
      }
    }

    startTransition(async () => {
      if (emailMode === "magic") {
        const result = await sendMagicLinkAction(email);
        if (!result.ok) {
          setError(result.message);
        } else {
          setInfo("ログイン用リンクをメールで送信しました。受信トレイをご確認ください。");
        }
        return;
      }

      if (emailMode === "signup") {
        const result = await signUpWithPasswordAction(email, password);
        if (!result.ok) {
          setError(result.message);
        } else {
          setInfo(
            "確認メールを送信しました。メール内のリンクから登録を完了してください。",
          );
        }
        return;
      }

      const result = await signInWithPasswordAction(email, password);
      if (!result.ok) {
        setError(result.message);
      } else {
        router.replace("/");
        router.refresh();
      }
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-[20px] font-bold">
          ログイン / 新規登録
        </CardTitle>
        <p className="text-[12px] text-[var(--text-2)]">
          視能訓練士国試対策アプリ ORT ACE
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGoogle}
          disabled={googlePending || pending}
          variant="outline"
          className="h-11 w-full gap-2 text-[14px]"
        >
          <GoogleIcon />
          {googlePending ? "リダイレクト中..." : "Google で続ける"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[11px] text-[var(--text-3)]">または</span>
          <Separator className="flex-1" />
        </div>

        <button
          type="button"
          onClick={() => setShowEmail((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 text-[12px] text-[var(--text-2)] hover:text-[var(--text-1)]"
          aria-expanded={showEmail}
        >
          <Mail className="h-3.5 w-3.5" />
          メールアドレスで{showEmail ? "閉じる" : "続ける"}
          {showEmail ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showEmail ? (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="flex gap-1 rounded-lg bg-[var(--bg-muted)] p-1 text-[12px]">
              <ModeTab
                active={emailMode === "login"}
                onClick={() => setEmailMode("login")}
                label="ログイン"
              />
              <ModeTab
                active={emailMode === "signup"}
                onClick={() => setEmailMode("signup")}
                label="新規登録"
              />
              <ModeTab
                active={emailMode === "magic"}
                onClick={() => setEmailMode("magic")}
                label="リンクで"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                required
              />
            </div>

            {emailMode !== "magic" ? (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px]">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    emailMode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                  required
                  minLength={6}
                />
                {emailMode === "signup" ? (
                  <p className="text-[11px] text-[var(--text-3)]">
                    6文字以上・英字と数字を含めてください。
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] leading-5 text-[var(--text-3)]">
                パスワード不要。メールに届くリンクをタップするだけでログインできます。
              </p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full text-[14px]"
            >
              {pending
                ? "送信中..."
                : emailMode === "login"
                  ? "ログイン"
                  : emailMode === "signup"
                    ? "登録する"
                    : "リンクを送る"}
            </Button>
          </form>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] leading-5 text-destructive">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-[12px] leading-5 text-[var(--text-1)]">
            {info}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1.5 transition-colors ${
        active
          ? "bg-background text-[var(--text-1)] shadow-sm"
          : "text-[var(--text-3)] hover:text-[var(--text-2)]"
      }`}
    >
      {label}
    </button>
  );
}

function validatePassword(pw: string): string | null {
  if (pw.length < 6) return "パスワードは6文字以上で入力してください。";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "パスワードは英字と数字を両方含めてください。";
  }
  return null;
}
