import type {
  ExamTiming,
  Grade,
  Goal,
  ProfilesRow,
} from "@/lib/supabase/database.types";

export const EXAM_TIMING_OPTIONS: readonly {
  value: ExamTiming;
  label: string;
  description: string;
}[] = [
  {
    value: "next_exam",
    label: "次回の国家試験を受験する",
    description: "本番までの残り期間を意識して進める",
  },
  {
    value: "later",
    label: "翌年度以降に受験する",
    description: "基礎から少しずつ積み上げる",
  },
  {
    value: "undecided",
    label: "まだ決めていない",
    description: "まずは診断で今の位置を確認する",
  },
] as const;

const EXAM_TIMINGS = EXAM_TIMING_OPTIONS.map(({ value }) => value);

type OnboardingProfile = Pick<
  ProfilesRow,
  "nickname" | "exam_timing" | "grade" | "goal"
>;

export function isExamTiming(value: string): value is ExamTiming {
  return EXAM_TIMINGS.includes(value as ExamTiming);
}

/**
 * exam_timing 導入前に完了した利用者も、そのまま利用できるようにする。
 */
export function hasCompletedOnboarding(
  profile: OnboardingProfile | null | undefined,
): boolean {
  return Boolean(
    profile?.nickname &&
      (profile.exam_timing || hasLegacyOnboardingAnswers(profile.grade, profile.goal)),
  );
}

export function getExamTimingLabel(
  examTiming: ExamTiming | null | undefined,
): string | null {
  return (
    EXAM_TIMING_OPTIONS.find(({ value }) => value === examTiming)?.label ?? null
  );
}

function hasLegacyOnboardingAnswers(
  grade: Grade | null,
  goal: Goal | null,
): boolean {
  return Boolean(grade && goal);
}
