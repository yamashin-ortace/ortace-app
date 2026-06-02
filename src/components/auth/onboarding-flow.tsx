"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOnboardingAction } from "@/lib/auth/onboarding-actions";
import { EXAM_TIMING_OPTIONS } from "@/lib/auth/onboarding-profile";
import { DIAGNOSTIC_QUESTION_COUNT } from "@/lib/onboarding/diagnostic";
import type { ExamTiming } from "@/lib/supabase/database.types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Play,
  Sparkles,
  Timer,
} from "lucide-react";

export function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState("");
  const [examTiming, setExamTiming] = useState<ExamTiming | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function next() {
    setError(null);
    if (step === 1) {
      const trimmed = nickname.trim();
      if (!trimmed) return setError("ニックネームを入力してください。");
      if (trimmed.length > 20) return setError("ニックネームは20文字以内で入力してください。");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!examTiming) return setError("受験予定を選択してください。");
      setStep(3);
      return;
    }
  }

  function back() {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }

  function submit(destination: "diagnostic" | "home") {
    if (!examTiming) return;
    setError(null);
    const fd = new FormData();
    fd.append("nickname", nickname.trim());
    fd.append("examTiming", examTiming);
    fd.append("destination", destination);
    startTransition(async () => {
      const result = await saveOnboardingAction(fd);
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step >= n ? "bg-primary" : "bg-[var(--bg-muted)]"
              }`}
            />
          ))}
        </div>
        <CardTitle className="text-center text-[20px] font-bold">
          {step === 1
            ? "はじめまして"
            : step === 2
              ? "次の2月に受験しますか？"
              : "最初に現在地を知ろう"}
        </CardTitle>
        <p className="text-center text-[12px] text-[var(--text-2)]">
          {step === 1
            ? "あなたのことを少しだけ教えてね。"
            : step === 2
              ? "学習ペースの目安に使います。"
              : "初回診断を受けると、学習の優先順位が整います。"}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-[12px]">
              ニックネーム
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <p className="text-[11px] text-[var(--text-3)]">
              アプリ内の表示にだけ使います。あとから変更できます。
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            {EXAM_TIMING_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                active={examTiming === option.value}
                onClick={() => setExamTiming(option.value)}
                label={option.label}
                description={option.description}
              />
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 px-1">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
                <Compass className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-[var(--text-1)]">
                  {DIAGNOSTIC_QUESTION_COUNT}問で得意・苦手を確認
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">
                  9分野から3問ずつ出題。解答をもとに、現在地の目安を表示します。
                </p>
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-3">
              <DiagnosticBenefit
                icon={<Sparkles />}
                title="あなた向けの優先順位が分かる"
                description="診断後は、復習や苦手克服を始めやすくなります。"
              />
              <DiagnosticBenefit
                icon={<Timer />}
                title="所要時間は15〜25分"
                description="途中で離れても、解いた分は記録されます。"
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {error}
          </p>
        ) : null}

        <div className={step === 3 ? "space-y-2.5" : "flex gap-2"}>
          {step === 3 ? (
            <Button
              type="button"
              onClick={() => submit("diagnostic")}
              disabled={pending}
              className="mx-auto flex h-10 gap-1.5 px-5"
            >
              {pending ? "保存中..." : "診断をはじめる"}
              <Play className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <div className={step === 3 ? "flex items-center justify-between" : "contents"}>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={pending}
                className="h-10 gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                戻る
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                onClick={next}
                disabled={pending}
                className="ml-auto h-10 gap-1"
              >
                次へ
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => submit("home")}
                disabled={pending}
                className="px-1 py-1 text-[11px] font-bold text-[var(--text-3)] underline underline-offset-2 disabled:opacity-50"
              >
                あとで受ける
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosticBenefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)] [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:[stroke-width:2.5]">
        {icon}
      </span>
      <div>
        <p className="text-[12px] font-bold text-[var(--text-1)]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-[var(--bg-muted)]"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-[var(--text-1)]">{label}</span>
        {active ? <Check className="h-4 w-4 text-primary" /> : null}
      </div>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{description}</p>
    </button>
  );
}
