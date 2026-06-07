import { DailyLimitBanner } from "@/components/study/daily-limit-banner";
import { ContinueQuizCard } from "@/components/study/continue-quiz-card";
import { FilterModeCard } from "@/components/study/filter-mode-card";
import { ExamPackLockedFeatureList } from "@/components/study/exam-pack-locked-card";
import { MockModeCard } from "@/components/study/mock-mode-card";
import { OriginalQuestionPreviewCard } from "@/components/study/original-question-preview-card";
import { RandomModeCard } from "@/components/study/random-mode-card";
import { RecommendationSection } from "@/components/study/recommendation-section";
import { RoundCard } from "@/components/study/round-card";
import { BookmarkSetSection } from "@/components/study/bookmark-set-section";
import { WeakClusterSection } from "@/components/study/weak-cluster-section";
import { UnansweredModeCard } from "@/components/study/unanswered-mode-card";
import { HorizontalSnapRow } from "@/components/ui/horizontal-snap-row";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { EXAM_ROUNDS } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";
import { getAiThemeCluster } from "@/lib/ai-coach/theme-cluster";

export default async function StudyPage() {
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlanForProfile(session.profile)
    : "free";

  const questions = await loadAllQuestions();
  const clusters = questions.map((q) => {
    const cluster = getAiThemeCluster(q);
    return { id: q.id, clusterId: cluster.id, clusterLabel: cluster.label };
  });

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        学習
      </h1>

      <DailyLimitBanner plan={plan} />
      <ContinueQuizCard />
      <RecommendationSection clusters={clusters} questions={questions} plan={plan} />

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          基本の演習
        </h2>
        <div className="space-y-2.5">
          <UnansweredModeCard />
          <FilterModeCard />
          <RandomModeCard />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          年度別に解く
        </h2>
        <HorizontalSnapRow
          ariaLabel="第47回〜第56回 過去問の年度カード"
          items={EXAM_ROUNDS.map((round) => (
            <RoundCard key={round} round={round} />
          ))}
        />
      </section>

      <BookmarkSetSection />

      <section className="space-y-2">
        <div className="space-y-0.5">
          <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
            {plan === "exam" ? "国試対策パック" : "国試対策パック限定"}
          </h2>
          <p className="text-[11px] leading-relaxed text-[var(--text-3)]">
            直前期の仕上げに使う機能をまとめています。
          </p>
        </div>
        {plan === "exam" ? (
          <div className="space-y-2.5">
            <WeakClusterSection
              clusters={clusters}
              heading="テーマ別 3問チェック TOP5"
            />
            <OriginalQuestionPreviewCard plan={plan} />
            <MockModeCard plan={plan} />
          </div>
        ) : (
          <ExamPackLockedFeatureList />
        )}
      </section>

    </div>
  );
}
