import { DailyLimitBanner } from "@/components/study/daily-limit-banner";
import { ContinueQuizCard } from "@/components/study/continue-quiz-card";
import { FilterModeCard } from "@/components/study/filter-mode-card";
import { RandomModeCard } from "@/components/study/random-mode-card";
import { RoundCard } from "@/components/study/round-card";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { EXAM_ROUNDS } from "@/lib/questions";

export default async function StudyPage() {
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlan({
        plan: session.profile.plan,
        status: session.profile.plan_status,
        expiresAt: session.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        学習
      </h1>

      <DailyLimitBanner plan={plan} />
      <ContinueQuizCard />

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          年度から選ぶ
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {[...EXAM_ROUNDS].reverse().map((round) => (
            <RoundCard key={round} round={round} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-3)]">
          その他のモード
        </h2>
        <div className="space-y-2.5">
          <FilterModeCard />
          <RandomModeCard />
        </div>
      </section>
    </div>
  );
}
