export const LAST_QUIZ_STORAGE_KEY = "ortace.lastQuiz";

export type LastQuizProgress = {
  href: string;
  label: string;
  index: number;
  total: number;
  savedAt: string;
};

export function readLastQuizProgress(): LastQuizProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastQuizProgress>;
    if (
      typeof parsed.href !== "string" ||
      typeof parsed.label !== "string" ||
      typeof parsed.index !== "number" ||
      typeof parsed.total !== "number" ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }
    return parsed as LastQuizProgress;
  } catch {
    return null;
  }
}

export function writeLastQuizProgress(progress: LastQuizProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_QUIZ_STORAGE_KEY, JSON.stringify(progress));
}

export function clearLastQuizProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_QUIZ_STORAGE_KEY);
}
