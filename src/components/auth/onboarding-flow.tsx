"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOnboardingAction } from "@/lib/auth/onboarding-actions";
import type { Grade, Goal } from "@/lib/supabase/database.types";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const GRADES: { value: Grade; description: string }[] = [
  { value: "1年", description: "基礎を着実に積み上げる時期" },
  { value: "2年", description: "視能学・眼科学が本格化する時期" },
  { value: "3年", description: "実習と国試対策の橋渡し" },
  { value: "受験生", description: "本番まで全力で駆け抜ける" },
];

const GOALS: { value: Goal; description: string }[] = [
  { value: "基礎固め", description: "毎日コツコツ、用語と仕組みを身につける" },
  { value: "苦手克服", description: "間違えた分野を重点的に潰す" },
  { value: "本番対策", description: "過去問を繰り返し解いて得点力を伸ばす" },
];

export function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
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
      if (!grade) return setError("学年を選択してください。");
      setStep(3);
      return;
    }
  }

  function back() {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }

  function submit() {
    if (!grade || !goal) return;
    setError(null);
    const fd = new FormData();
    fd.append("nickname", nickname.trim());
    fd.append("grade", grade);
    fd.append("goal", goal);
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
              ? "学年を教えてください"
              : "目標を選びましょう"}
        </CardTitle>
        <p className="text-center text-[12px] text-[var(--text-2)]">
          {step === 1
            ? "あなたのことを少しだけ教えてね。"
            : step === 2
              ? "今の状況に合わせて学習を最適化します。"
              : "途中でいつでも変更できます。"}
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
              placeholder="例：やまし"
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
            {GRADES.map((g) => (
              <ChoiceButton
                key={g.value}
                active={grade === g.value}
                onClick={() => setGrade(g.value)}
                label={g.value}
                description={g.description}
              />
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            {GOALS.map((g) => (
              <ChoiceButton
                key={g.value}
                active={goal === g.value}
                onClick={() => setGoal(g.value)}
                label={g.value}
                description={g.description}
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
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
            <Button
              type="button"
              onClick={submit}
              disabled={pending || !goal}
              className="ml-auto h-10 gap-1"
            >
              {pending ? "保存中..." : "はじめる"}
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
