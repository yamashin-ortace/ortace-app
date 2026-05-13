import { DailyLimitBanner } from "@/components/study/daily-limit-banner";
import { ContinueQuizCard } from "@/components/study/continue-quiz-card";
import { FilterModeCard } from "@/components/study/filter-mode-card";
import { MockModeCard } from "@/components/study/mock-mode-card";
import { RandomModeCard } from "@/components/study/random-mode-card";
import { RecommendationSection } from "@/components/study/recommendation-section";
import { RoundCard } from "@/components/study/round-card";
import { BookmarkSetSection } from "@/components/study/bookmark-set-section";
import { HorizontalSnapRow } from "@/components/ui/horizontal-snap-row";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { EXAM_ROUNDS } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function StudyPage() {
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlan({
        plan: session.profile.plan,
        status: session.profile.plan_status,
        expiresAt: session.profile.plan_expires_at,
      })
    : "free";

  const questions = await loadAllQuestions();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        学習
      </h1>

      <DailyLimitBanner plan={plan} />
      <ContinueQuizCard />

      <RecommendationSection totalQuestions={questions.length} />

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          演習モード
        </h2>
        <div className="space-y-2.5">
          <FilterModeCard />
          <section className="space-y-2">
            <HorizontalSnapRow
              ariaLabel="第47回〜第56回 過去問の年度カード"
              items={EXAM_ROUNDS.map((round) => (
                <RoundCard key={round} round={round} />
              ))}
            />
          </section>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          腕試し
        </h2>
        <div className="space-y-2.5">
          <MockModeCard />
          <RandomModeCard />
        </div>
      </section>

      <BookmarkSetSection />
    </div>
  );
}
