export const WEAK_PRACTICE_STATE_STORAGE_KEY = "ortace.weakPracticeState";
export const WEAK_PRACTICE_STATE_UPDATED_EVENT =
  "ortace:weak-practice-state-updated";
export const WEAK_PRACTICE_COOLDOWN_DAYS = 3;

export type WeakPracticeThemeRecord = {
  categoryKey: string;
  practicedAt: string;
  questionIds: string[];
  observing: boolean;
};

export type WeakPracticeState = {
  version: 1;
  lastPracticedCategoryKey: string | null;
  themes: Record<string, WeakPracticeThemeRecord>;
};

export function createWeakPracticeState(): WeakPracticeState {
  return {
    version: 1,
    lastPracticedCategoryKey: null,
    themes: {},
  };
}

export function parseWeakPracticeState(raw: string | null): WeakPracticeState {
  if (!raw) return createWeakPracticeState();
  try {
    return normalizeWeakPracticeState(JSON.parse(raw));
  } catch {
    return createWeakPracticeState();
  }
}

export function serializeWeakPracticeState(state: WeakPracticeState): string {
  return JSON.stringify(normalizeWeakPracticeState(state));
}

export function recordWeakPracticeSession(
  state: WeakPracticeState,
  params: {
    categoryKey: string;
    questionIds: readonly string[];
    correctCount: number;
    now?: Date;
  },
): WeakPracticeState {
  const current = normalizeWeakPracticeState(state);
  const questionIds = [...new Set(params.questionIds)];
  const ratio =
    questionIds.length === 0
      ? 0
      : Math.round((params.correctCount / questionIds.length) * 100);
  const observing = questionIds.length >= 3 && ratio >= 80;
  const practicedAt = (params.now ?? new Date()).toISOString();

  return {
    version: 1,
    lastPracticedCategoryKey: params.categoryKey,
    themes: {
      ...current.themes,
      [params.categoryKey]: {
        categoryKey: params.categoryKey,
        practicedAt,
        questionIds,
        observing,
      },
    },
  };
}

export function getCoolingQuestionIds(
  state: WeakPracticeState,
  categoryKey: string,
  now = new Date(),
): Set<string> {
  const record = state.themes[categoryKey];
  if (!record || !isWithinCooldown(record.practicedAt, now)) return new Set();
  return new Set(record.questionIds);
}

export function isWithinCooldown(
  practicedAt: string,
  now = new Date(),
): boolean {
  const practicedTime = Date.parse(practicedAt);
  if (!Number.isFinite(practicedTime)) return false;
  return (
    now.getTime() - practicedTime <
    WEAK_PRACTICE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  );
}

function normalizeWeakPracticeState(value: unknown): WeakPracticeState {
  if (!isObject(value) || value.version !== 1 || !isObject(value.themes)) {
    return createWeakPracticeState();
  }

  const themes: Record<string, WeakPracticeThemeRecord> = {};
  for (const [key, rawRecord] of Object.entries(value.themes)) {
    if (!isWeakPracticeThemeRecord(rawRecord) || rawRecord.categoryKey !== key) {
      continue;
    }
    themes[key] = {
      categoryKey: key,
      practicedAt: rawRecord.practicedAt,
      questionIds: [...new Set(rawRecord.questionIds)],
      observing: rawRecord.observing,
    };
  }

  return {
    version: 1,
    lastPracticedCategoryKey:
      typeof value.lastPracticedCategoryKey === "string"
        ? value.lastPracticedCategoryKey
        : null,
    themes,
  };
}

function isWeakPracticeThemeRecord(
  value: unknown,
): value is WeakPracticeThemeRecord {
  return (
    isObject(value) &&
    typeof value.categoryKey === "string" &&
    typeof value.practicedAt === "string" &&
    Array.isArray(value.questionIds) &&
    value.questionIds.every((id) => typeof id === "string") &&
    typeof value.observing === "boolean"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
