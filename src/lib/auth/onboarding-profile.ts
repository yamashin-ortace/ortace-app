import type {
  ExamTiming,
  Grade,
  Goal,
  ProfilesRow,
} from "@/lib/supabase/database.types";

export const EXAM_TIMING_OPTIONS: readonly {
  value: Exclude<ExamTiming, "undecided">;
  label: string;
  description: string;
}[] = [
  {
    value: "next_exam",
    label: "受験する",
    description: "本番までの期間を意識して進める",
  },
  {
    value: "later",
    label: "受験しない",
    description: "翌年度以降に向けて基礎から積み上げる",
  },
] as const;

const EXAM_TIMINGS: readonly ExamTiming[] = [
  "next_exam",
  "later",
  "undecided",
];

type OnboardingProfile = Pick<
  ProfilesRow,
  "nickname" | "exam_timing" | "grade" | "goal"
>;

export function isExamTiming(value: string): value is ExamTiming {
  return EXAM_TIMINGS.includes(value as ExamTiming);
}

export function isSelectableExamTiming(
  value: string,
): value is Exclude<ExamTiming, "undecided"> {
  return EXAM_TIMING_OPTIONS.some((option) => option.value === value);
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
  if (examTiming === "next_exam") return "次の2月に受験する";
  if (examTiming === "later") return "次の2月は受験しない";
  if (examTiming === "undecided") return "未定";
  return null;
}

function hasLegacyOnboardingAnswers(
  grade: Grade | null,
  goal: Goal | null,
): boolean {
  return Boolean(grade && goal);
}
