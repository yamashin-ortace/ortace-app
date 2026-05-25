import type { Metadata } from "next";
import { HomeGreeting } from "@/components/home-greeting";
import { HomeDashboard } from "@/components/home-dashboard";
import { HomeEstimatedScore } from "@/components/home-estimated-score";
import { HomeExamCountdown } from "@/components/home-exam-countdown";
import { HomeStatsRow } from "@/components/home-stats-row";
import { HomeTodayCta } from "@/components/home-today-cta";
import { HomeTrendChart } from "@/components/home-trend-chart";
import { DiagnosticBanner } from "@/components/onboarding/diagnostic-banner";
import { TrialBanner } from "@/components/billing/trial-banner";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionContext } from "@/lib/auth/profile";
import { FIELDS, type Field } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";
import { getAiThemeCluster } from "@/lib/ai-coach/theme-cluster";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionContext();
  if (session) {
    return {
      title: "ホーム｜ORT ACE",
      description:
        "今日の学習・記録の概要。視能訓練士国家試験対策アプリ ORT ACE。",
    };
  }
  return {
    title: "ORT ACE — 視能訓練士国家試験対策",
    description:
      "合格の、一歩上へ。過去問1,500問（第47〜56回）、解説・ノート・ブックマーク・連続学習と分野別統計でORT国家試験の学習をサポート。無料プランですぐにはじめられます。",
  };
}

export default async function HomePage() {
  const session = await getSessionContext();

  if (!session) {
    return <LandingPage />;
  }

  const questions = await loadAllQuestions();
  const fieldTotals = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      questions.filter((question) => question.majorCategory === field).length,
    ]),
  ) as Record<Field, number>;
  const clusters = questions.map((q) => {
    const cluster = getAiThemeCluster(q);
    return { id: q.id, clusterId: cluster.id, clusterLabel: cluster.label };
  });

  return (
    <div className="space-y-6 pt-2">
      <HomeGreeting />
      <TrialBanner trial={session.trial} />
      <DiagnosticBanner />
      <HomeExamCountdown totalQuestions={questions.length} />
      <HomeTodayCta totalQuestions={questions.length} clusters={clusters} />
      <HomeStatsRow />
      <HomeEstimatedScore questions={questions} />
      <HomeTrendChart />
      <HomeDashboard
        questionTotals={{
          total: questions.length,
          fields: fieldTotals,
        }}
      />
    </div>
  );
}
