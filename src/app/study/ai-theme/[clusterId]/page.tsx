import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { AiThemePlayClient } from "@/components/study/ai-theme-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { isScorableQuestion } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";
import {
  getAiThemeClusterById,
  getAiThemeKey,
} from "@/lib/ai-coach/theme-cluster";

type Props = {
  params: Promise<{ clusterId: string }>;
  searchParams: Promise<{ count?: string; exclude?: string; focus?: string }>;
};

export default async function AiThemePage({ params, searchParams }: Props) {
  const { clusterId: rawClusterId } = await params;
  const query = await searchParams;
  const clusterId = decodeURIComponent(rawClusterId);
  const cluster = getAiThemeClusterById(clusterId);
  if (!cluster) notFound();

  const count = parseCount(query.count);
  const excludeIds = parseExcludeIds(query.exclude);
  const focusTheme = parseFocusTheme(query.focus);
  const allQuestions = await loadAllQuestions();
  const questions = allQuestions.filter(
    (question) =>
      isScorableQuestion(question) &&
      getAiThemeKey(question) === cluster.id &&
      !excludeIds.has(question.id),
  );
  if (questions.length === 0) notFound();

  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlan({
        plan: sessionContext.profile.plan,
        status: sessionContext.profile.plan_status,
        expiresAt: sessionContext.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          {cluster.label}
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          AIコーチが選んだテーマを、3問だけ確認します
        </p>
      </div>

      <AiThemePlayClient
        questions={questions}
        clusterLabel={cluster.label}
        focusTheme={focusTheme}
        count={count}
        plan={plan}
      />
    </div>
  );
}

function parseFocusTheme(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  return normalized.slice(0, 80);
}

function parseCount(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(3, Math.max(1, Math.floor(parsed)));
}

function parseExcludeIds(value: string | undefined): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^\d{2}-\d{1,3}$/.test(item)),
  );
}
