/**
 * クイズ画面まわりのユーザー設定（端末ローカル）
 */

export const QUIZ_SETTINGS_STORAGE_KEY = "ortace.settings.quiz";

export type QuizSettings = {
  /** 解答前に `Try #N` バッジを表示するか */
  showAttemptCountBeforeAnswer: boolean;
};

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  showAttemptCountBeforeAnswer: true,
};

export function parseQuizSettings(raw: string | null): QuizSettings {
  if (!raw) return DEFAULT_QUIZ_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<QuizSettings>;
    return {
      showAttemptCountBeforeAnswer:
        typeof parsed.showAttemptCountBeforeAnswer === "boolean"
          ? parsed.showAttemptCountBeforeAnswer
          : DEFAULT_QUIZ_SETTINGS.showAttemptCountBeforeAnswer,
    };
  } catch {
    return DEFAULT_QUIZ_SETTINGS;
  }
}

export function serializeQuizSettings(settings: QuizSettings): string {
  return JSON.stringify(settings);
}
