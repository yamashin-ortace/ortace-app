/**
 * 本試験日（受験予定日）の保存・読み出し・カウントダウン計算。
 * 端末ローカルに保存する（Supabase 連携は後続フェーズで検討）。
 */

export const EXAM_DATE_STORAGE_KEY = "ortace.examDate";

/** "YYYY-MM-DD" 形式の日付文字列を検証する */
export function isValidExamDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseExamDate(value).getTime())
  );
}

/** "YYYY-MM-DD" を当日0時の Date に変換 */
export function parseExamDate(value: string): Date {
  const [y, m, d] = value.split("-").map((s) => Number(s));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Date → "YYYY-MM-DD" */
export function formatExamDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 本試験の既定日（次に到来する2月の第3木曜日）。
 * 視能訓練士国家試験は例年2月の第3木曜日に開催されるため、その日付を仮の固定値とする。
 * 受験生が個別に変更する UI は当面提供しない（仮固定）。
 */
export function getDefaultExamDate(now: Date = new Date()): string {
  let year = now.getFullYear();
  const candidate = getThirdThursday(year, 1);
  if (now > candidate) {
    year += 1;
  }
  return formatExamDate(getThirdThursday(year, 1));
}

function getThirdThursday(year: number, monthIndex: number): Date {
  const first = new Date(year, monthIndex, 1);
  const dow = first.getDay(); // 0=日, 4=木
  const firstThursdayDay = 1 + ((4 - dow + 7) % 7);
  return new Date(year, monthIndex, firstThursdayDay + 14);
}

/** 本試験までの残り日数（当日=0、過ぎていたら負値） */
export function getDaysUntilExam(
  examDateISO: string,
  now: Date = new Date(),
): number {
  const exam = parseExamDate(examDateISO);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = exam.getTime() - todayStart.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

/**
 * 推奨ペース（1日あたり何問）を計算する。
 * - 残り日数が0以下なら null
 * - 残り未着手 ÷ 残り日数 を 1〜20 の範囲にクリップ
 */
export function getRecommendedDailyPace(
  untouchedCount: number,
  daysRemaining: number,
  dailyCap = 20,
): number | null {
  if (daysRemaining <= 0) return null;
  if (untouchedCount <= 0) return null;
  const raw = Math.ceil(untouchedCount / daysRemaining);
  return Math.min(dailyCap, Math.max(1, raw));
}

/**
 * 推奨ペースを 10/15/20 のいずれかに丸める。
 * - 10未満 → 10
 * - 11〜15 → 15
 * - 16以上 → 20
 */
export function roundPaceToAllowedCount(
  pace: number | null,
): 10 | 15 | 20 | null {
  if (pace === null) return null;
  if (pace <= 10) return 10;
  if (pace <= 15) return 15;
  return 20;
}

/** "YYYY-MM-DD" を「YYYY年M月D日（曜）」に整形（曜表記） */
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatExamDateLabel(value: string): string {
  if (!isValidExamDateString(value)) return value;
  const d = parseExamDate(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY_LABELS[d.getDay()]}）`;
}
