/**
 * 受験生が選ぶ「学習プリセット」と、目標達成までのペース計算。
 *
 * 自由入力にすると現実離れした目標を立てがちなため、推奨プリセットから1つだけ選ぶ
 * 形にしている（「目標なし」を含む）。終了日は試験日ではなく "試験日 - N日"。
 * 直前の復習・模試バッファを残す目的。
 */

export const STUDY_GOAL_STORAGE_KEY = "ortace.studyGoal.preset";

/** プリセット ID。`none` は目標を立てないモード（既定）。 */
export type StudyGoalPresetId = "none" | "base" | "safe" | "top";

export type StudyGoalPreset = {
  id: StudyGoalPresetId;
  /** 表示名 */
  label: string;
  /** ひと言サマリ（設定 UI でラベルの下に出す） */
  summary: string;
  /** 過去問の周回目標（0 なら過去問を目標カウントに含めない） */
  pastRounds: number;
  /** オリジナル問題の周回目標（0 なら含めない） */
  originalRounds: number;
  /** 試験日 - N日 を達成期限とする（直前の復習バッファ） */
  daysBeforeExam: number;
};

/**
 * プリセット定義。
 *
 * - `base`：1周丁寧に。直前1ヶ月は復習・模試にあてる
 * - `safe`：合格安全圏。直前1ヶ月は復習・模試にあてる
 * - `top` ：上位合格。直前2ヶ月を復習・模試・弱点詰めにあてる
 *
 * オリジナル問題はリリース直後はまだ枠が小さい想定なので、
 * 過去問+オリジナルは「top」のみ採用する。
 */
export const STUDY_GOAL_PRESETS: readonly StudyGoalPreset[] = [
  {
    id: "none",
    label: "目標は立てない",
    summary:
      "自分のペースで毎日コツコツ。ペース表示は出さず、おすすめだけ参考にする。",
    pastRounds: 0,
    originalRounds: 0,
    daysBeforeExam: 0,
  },
  {
    id: "base",
    label: "ベース（1周）",
    summary:
      "試験1ヶ月前までに過去問を1周。直前1ヶ月は復習・模試にあてる。",
    pastRounds: 1,
    originalRounds: 0,
    daysBeforeExam: 30,
  },
  {
    id: "safe",
    label: "合格安全圏（2周）",
    summary:
      "試験1ヶ月前までに過去問を2周。本番に向けて知識をしっかり固める。",
    pastRounds: 2,
    originalRounds: 0,
    daysBeforeExam: 30,
  },
  {
    id: "top",
    label: "上位合格（2周＋オリジナル1周）",
    summary:
      "試験2ヶ月前までに過去問2周＋オリジナル1周。直前2ヶ月は弱点詰め＋模試。",
    pastRounds: 2,
    originalRounds: 1,
    daysBeforeExam: 60,
  },
];

export const STUDY_GOAL_DEFAULT_ID: StudyGoalPresetId = "none";

/**
 * オリジナル問題の総数（CLAUDE.md の目標：180問）。
 * オリジナル問題はまだアプリに実装されていないため、ペース計算の暫定値。
 */
export const ORIGINAL_QUESTIONS_TOTAL = 180;

export function isStudyGoalPresetId(value: unknown): value is StudyGoalPresetId {
  return (
    value === "none" ||
    value === "base" ||
    value === "safe" ||
    value === "top"
  );
}

export function getStudyGoalPreset(id: StudyGoalPresetId): StudyGoalPreset {
  return (
    STUDY_GOAL_PRESETS.find((p) => p.id === id) ??
    STUDY_GOAL_PRESETS.find((p) => p.id === "none")!
  );
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

/** "YYYY-MM-DD" → 当日0時の Date */
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
  preset: StudyGoalPreset;
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
};

/**
 * プリセット・試験日・現状の累計解答から、ペース計算結果を組み立てる。
 * `preset.id === "none"` のときは null を返す（呼び出し側で CTA に切り替える）。
 */
export function summarizeStudyGoal(params: {
  preset: StudyGoalPreset;
  examDateISO: string;
  pastQuestionsTotal: number;
  lifetimeAnswers: number;
  /** 上限キャップ（1日でこれ以上は出さない）。既定 80問。 */
  dailyCap?: number;
  /** 現在時刻（テスト用） */
  now?: Date;
}): StudyGoalSummary | null {
  const {
    preset,
    examDateISO,
    pastQuestionsTotal,
    lifetimeAnswers,
    dailyCap = 80,
    now = new Date(),
  } = params;
  if (preset.id === "none") return null;

  const targetAnswers =
    pastQuestionsTotal * preset.pastRounds +
    ORIGINAL_QUESTIONS_TOTAL * preset.originalRounds;
  const deadlineISO = getGoalDeadlineISO(examDateISO, preset.daysBeforeExam);
  const daysUntilDeadline = getDaysUntilDeadline(deadlineISO, now);
  const remainingAnswers = Math.max(0, targetAnswers - lifetimeAnswers);

  let paceAnswersPerDay: number | null;
  if (remainingAnswers <= 0 || daysUntilDeadline <= 0) {
    paceAnswersPerDay = null;
  } else {
    paceAnswersPerDay = Math.min(
      dailyCap,
      Math.max(1, Math.ceil(remainingAnswers / daysUntilDeadline)),
    );
  }

  return {
    preset,
    targetAnswers,
    deadlineISO,
    daysUntilDeadline,
    remainingAnswers,
    paceAnswersPerDay,
  };
}

/** "YYYY-MM-DD" を「YYYY年M月D日」に整形 */
export function formatGoalDeadlineLabel(value: string): string {
  const d = parseISODate(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
