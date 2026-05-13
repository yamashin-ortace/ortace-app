/**
 * 学習プリセット（B-prime：ガードレール付き自由設定）と、目標達成までのペース計算。
 *
 * 完全自由ロールにすると現実離れした目標を立てがちなので、
 * 「スコープ × 周回 × 期限」をそれぞれ妥当な範囲から選ぶ形にしている。
 * `enabled = false`（既定）のときは目標計算をオフにしてホームのCTAだけ表示する。
 */

export const STUDY_GOAL_STORAGE_KEY = "ortace.studyGoal.preset";

/** 目標カウントに含める問題集の範囲 */
export type StudyGoalScope = "past" | "past_plus_original";

/** 達成期限（試験日からの差し引き）。`exam` は試験日当日まで、`custom` は任意日付。 */
export type StudyGoalDeadline = "1m_before" | "2m_before" | "exam" | "custom";

export const STUDY_GOAL_SCOPES: ReadonlyArray<{
  id: StudyGoalScope;
  label: string;
  hint: string;
}> = [
  {
    id: "past",
    label: "過去問だけ",
    hint: "過去問1,500問を解く",
  },
  {
    id: "past_plus_original",
    label: "過去問＋オリジナル",
    hint: "過去問+オリジナル 計1,680問を解く",
  },
];

/** 周回（1〜3）。これ以上は現実的に苦しいので入れない。 */
export const STUDY_GOAL_ROUNDS = [1, 2, 3] as const;
export type StudyGoalRounds = (typeof STUDY_GOAL_ROUNDS)[number];

export const STUDY_GOAL_DEADLINES: ReadonlyArray<{
  id: StudyGoalDeadline;
  label: string;
  /** 試験日 - daysBeforeExam 日。`exam` は 0。 */
  daysBeforeExam: number;
  hint: string;
}> = [
  {
    id: "1m_before",
    label: "試験1ヶ月前",
    daysBeforeExam: 30,
    hint: "直前1ヶ月は復習・模試にあてる",
  },
  {
    id: "2m_before",
    label: "試験2ヶ月前",
    daysBeforeExam: 60,
    hint: "直前2ヶ月を弱点詰め＋模試にあてる",
  },
  {
    id: "exam",
    label: "試験日まで",
    daysBeforeExam: 0,
    hint: "試験日直前まで丸ごと使う",
  },
  {
    id: "custom",
    label: "自分で決める",
    daysBeforeExam: 0,
    hint: "日付を選んで設定する",
  },
];

export type StudyGoalConfig = {
  enabled: boolean;
  scope: StudyGoalScope;
  rounds: StudyGoalRounds;
  deadline: StudyGoalDeadline;
  /** deadline === "custom" のときに使う任意日付（"YYYY-MM-DD"）。未設定時は試験日にフォールバック。 */
  customDeadlineISO?: string;
};

export const DEFAULT_STUDY_GOAL: StudyGoalConfig = {
  enabled: false,
  scope: "past",
  rounds: 1,
  deadline: "1m_before",
};

/** 1日に解ける現実的な上限（このペースを超える目標は赤表示にして警告する） */
export const REALISTIC_DAILY_CAP = 80;

/** オリジナル問題の総数（CLAUDE.md の目標：180問） */
export const ORIGINAL_QUESTIONS_TOTAL = 180;

export function isStudyGoalScope(value: unknown): value is StudyGoalScope {
  return value === "past" || value === "past_plus_original";
}

export function isStudyGoalDeadline(value: unknown): value is StudyGoalDeadline {
  return (
    value === "1m_before" ||
    value === "2m_before" ||
    value === "exam" ||
    value === "custom"
  );
}

/** "YYYY-MM-DD" の妥当性を簡易チェック */
export function isValidISODate(value: unknown): value is string {
  return (
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

export function isStudyGoalRounds(value: unknown): value is StudyGoalRounds {
  return value === 1 || value === 2 || value === 3;
}

export function parseStudyGoalConfig(raw: string | null): StudyGoalConfig {
  if (!raw) return DEFAULT_STUDY_GOAL;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_STUDY_GOAL;
    const v = parsed as Record<string, unknown>;
    return {
      enabled: typeof v.enabled === "boolean" ? v.enabled : false,
      scope: isStudyGoalScope(v.scope) ? v.scope : DEFAULT_STUDY_GOAL.scope,
      rounds: isStudyGoalRounds(v.rounds)
        ? v.rounds
        : DEFAULT_STUDY_GOAL.rounds,
      deadline: isStudyGoalDeadline(v.deadline)
        ? v.deadline
        : DEFAULT_STUDY_GOAL.deadline,
      customDeadlineISO: isValidISODate(v.customDeadlineISO)
        ? v.customDeadlineISO
        : undefined,
    };
  } catch {
    return DEFAULT_STUDY_GOAL;
  }
}

export function serializeStudyGoalConfig(config: StudyGoalConfig): string {
  return JSON.stringify(config);
}

export function getDeadlineDaysBeforeExam(deadline: StudyGoalDeadline): number {
  return STUDY_GOAL_DEADLINES.find((d) => d.id === deadline)?.daysBeforeExam ?? 0;
}

export function getDeadlineLabel(deadline: StudyGoalDeadline): string {
  return STUDY_GOAL_DEADLINES.find((d) => d.id === deadline)?.label ?? "";
}

export function getScopeLabel(scope: StudyGoalScope): string {
  return STUDY_GOAL_SCOPES.find((s) => s.id === scope)?.label ?? "";
}

/** 目標期限 (= 試験日 - daysBeforeExam) を "YYYY-MM-DD" で返す */
export function getGoalDeadlineISO(
  examDateISO: string,
  daysBeforeExam: number,
): string {
  const [y, m, d] = examDateISO.split("-").map((s) => Number(s));
  const exam = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  exam.setDate(exam.getDate() - daysBeforeExam);
  const yy = exam.getFullYear();
  const mm = String(exam.getMonth() + 1).padStart(2, "0");
  const dd = String(exam.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * config と試験日から最終的な目標期限の "YYYY-MM-DD" を解決する。
 * - "custom" + customDeadlineISO 有 → customDeadlineISO をそのまま返す
 * - "custom" だが customDeadlineISO 未設定 → 試験日にフォールバック
 * - その他のプリセット → 試験日 - daysBeforeExam
 */
export function resolveGoalDeadlineISO(
  config: Pick<StudyGoalConfig, "deadline" | "customDeadlineISO">,
  examDateISO: string,
): string {
  if (config.deadline === "custom") {
    return config.customDeadlineISO ?? examDateISO;
  }
  const daysBefore = getDeadlineDaysBeforeExam(config.deadline);
  return getGoalDeadlineISO(examDateISO, daysBefore);
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map((s) => Number(s));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** 期限までの残り日数（今日=0、過ぎていたら負値） */
export function getDaysUntilDeadline(
  deadlineISO: string,
  now: Date = new Date(),
): number {
  const deadline = parseISODate(deadlineISO);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(
    (deadline.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
}

export type StudyGoalSummary = {
  config: StudyGoalConfig;
  scopeLabel: string;
  deadlineLabelText: string;
  /** 目標とする総解答数 */
  targetAnswers: number;
  /** 目標期限 (YYYY-MM-DD) */
  deadlineISO: string;
  /** 期限までの残り日数 */
  daysUntilDeadline: number;
  /** 残りの目標総解答数 */
  remainingAnswers: number;
  /** 1日あたりの目安問題数（残÷残日数）。期限切れや達成済みなら null */
  paceAnswersPerDay: number | null;
  /** 1日 80問 を超える非現実的なペースなら true */
  isOverloaded: boolean;
};

/**
 * 設定値・試験日・現状の累計解答から、ペース計算結果を組み立てる。
 * `config.enabled === false` のときは null を返す（呼び出し側でCTAに切り替える）。
 */
export function summarizeStudyGoal(params: {
  config: StudyGoalConfig;
  examDateISO: string;
  pastQuestionsTotal: number;
  lifetimeAnswers: number;
  /** 上限キャップ（1日でこれ以上は出さない）。既定 80問。 */
  dailyCap?: number;
  /** 現在時刻（テスト用） */
  now?: Date;
}): StudyGoalSummary | null {
  const {
    config,
    examDateISO,
    pastQuestionsTotal,
    lifetimeAnswers,
    dailyCap = REALISTIC_DAILY_CAP,
    now = new Date(),
  } = params;
  if (!config.enabled) return null;

  const scopeBase =
    config.scope === "past_plus_original"
      ? pastQuestionsTotal + ORIGINAL_QUESTIONS_TOTAL
      : pastQuestionsTotal;
  const targetAnswers = scopeBase * config.rounds;
  const deadlineISO = resolveGoalDeadlineISO(config, examDateISO);
  const daysUntilDeadline = getDaysUntilDeadline(deadlineISO, now);
  const remainingAnswers = Math.max(0, targetAnswers - lifetimeAnswers);

  let rawPace: number | null = null;
  if (remainingAnswers > 0 && daysUntilDeadline > 0) {
    rawPace = Math.ceil(remainingAnswers / daysUntilDeadline);
  }
  const paceAnswersPerDay =
    rawPace === null ? null : Math.min(dailyCap, Math.max(1, rawPace));
  const isOverloaded = rawPace !== null && rawPace > REALISTIC_DAILY_CAP;

  return {
    config,
    scopeLabel: getScopeLabel(config.scope),
    deadlineLabelText: getDeadlineLabel(config.deadline),
    targetAnswers,
    deadlineISO,
    daysUntilDeadline,
    remainingAnswers,
    paceAnswersPerDay,
    isOverloaded,
  };
}

const WEEKDAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatGoalDeadlineLabel(value: string): string {
  const d = parseISODate(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "2026/03/15（日）" 形式（日付＋曜日） */
export function formatGoalDeadlineLabelWithWeekday(value: string): string {
  const d = parseISODate(value);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const wd = WEEKDAY_LABELS_JA[d.getDay()];
  return `${yy}/${mm}/${dd}（${wd}）`;
}

/**
 * UI 上で「設定中の組み合わせだと1日に何問必要か」を即時計算するための簡易関数。
 * 累計解答ゼロ前提で「ペースが現実的か」のプレビューに使う。
 */
export function previewDailyPace(params: {
  scope: StudyGoalScope;
  rounds: StudyGoalRounds;
  deadline: StudyGoalDeadline;
  customDeadlineISO?: string;
  examDateISO: string;
  pastQuestionsTotal: number;
  now?: Date;
}): { perDay: number | null; isOverloaded: boolean; daysLeft: number } {
  const {
    scope,
    rounds,
    deadline,
    customDeadlineISO,
    examDateISO,
    pastQuestionsTotal,
    now,
  } = params;
  const scopeBase =
    scope === "past_plus_original"
      ? pastQuestionsTotal + ORIGINAL_QUESTIONS_TOTAL
      : pastQuestionsTotal;
  const target = scopeBase * rounds;
  const deadlineISO = resolveGoalDeadlineISO(
    { deadline, customDeadlineISO },
    examDateISO,
  );
  const daysLeft = getDaysUntilDeadline(deadlineISO, now);
  if (daysLeft <= 0) return { perDay: null, isOverloaded: false, daysLeft };
  const raw = Math.ceil(target / daysLeft);
  return {
    perDay: raw,
    isOverloaded: raw > REALISTIC_DAILY_CAP,
    daysLeft,
  };
}
