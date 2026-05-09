/**
 * 過去問データのローダー（サーバー専用）
 *
 * 実装方針：
 * - public/questions/*.json を fs.readFile で読み込み（バンドルに含めない）
 * - React の cache() で同一リクエスト内では1回だけ読む
 * - クライアント側で同データが必要な時は fetch('/questions/...') を使う
 */
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import {
  EXAM_ROUNDS,
  type ChoiceKey,
  type ExamRound,
  type Question,
  type QuestionFormat,
  type RawQuestion,
  type RoundData,
  type Session,
} from "./types";

const QUESTIONS_DIR = path.join(process.cwd(), "public", "questions");

/** 試験回が有効か検査 */
export function isExamRound(value: unknown): value is ExamRound {
  return typeof value === "number" && (EXAM_ROUNDS as readonly number[]).includes(value);
}

/**
 * 公式の問番号から午前／午後を判定する。
 * - 午前：1〜75
 * - 午後：101〜175（100の位の「1」が午後の目印）
 */
export function sessionOf(questionNumber: number): Session {
  return questionNumber >= 100 ? "pm" : "am";
}

/** 公式番号 → 表示番号（1〜75）。午後は "1" プレフィックスを取り除く。 */
export function toDisplayNumber(questionNumber: number): number {
  return questionNumber >= 100 ? questionNumber - 100 : questionNumber;
}

/** 問番号 → 安定ID（"47-1" など） */
export function buildQuestionId(round: ExamRound, number: number): string {
  return `${round}-${number}`;
}

/** "1,3" → ["1","3"] / "4" → ["4"] */
function parseCorrectAnswers(raw: string): ChoiceKey[] {
  return raw
    .split(/[,、・]/)
    .map((s) => s.trim())
    .filter((s): s is ChoiceKey => /^[1-5]$/.test(s));
}

function parseFormat(raw: string): QuestionFormat {
  if (raw === "1択" || raw === "2択" || raw === "組み合わせ") return raw;
  // フォールバック：未知の形式は1択扱い（ログ出して気づける形にする）
  console.warn(`[questions] 未知の出題形式: ${raw}`);
  return "1択";
}

/** 生データ → 正規化済み Question */
function normalize(raw: RawQuestion): Question {
  const round = raw.回 as ExamRound;
  const number = raw.問番号;
  return {
    id: buildQuestionId(round, number),
    round,
    number,
    displayNumber: toDisplayNumber(number),
    session: sessionOf(number),
    field: raw.分野,
    theme: raw.テーマ,
    questionText: raw.問題文,
    choices: raw.選択肢 as Question["choices"],
    correctAnswer: raw.正答,
    correctAnswers: parseCorrectAnswers(raw.正答),
    format: parseFormat(raw.出題形式),
    majorCategory: raw.大分類,
    minorCategory: raw.中分類,
    explanation: raw.解説,
    images: raw.画像 && raw.画像.length > 0 ? raw.画像 : undefined,
  };
}

/** 1回分の問題データを読み込む */
export const loadRound = cache(async (round: ExamRound): Promise<RoundData> => {
  const filePath = path.join(QUESTIONS_DIR, `questions_${round}kai.json`);
  const json = await fs.readFile(filePath, "utf-8");
  const raw = JSON.parse(json) as RawQuestion[];
  return {
    round,
    questions: raw.map(normalize),
  };
});

/** 全10回分（1500問）を読み込む */
export const loadAllRounds = cache(async (): Promise<RoundData[]> => {
  return Promise.all(EXAM_ROUNDS.map((r) => loadRound(r)));
});

/** 指定回・指定問番号の問題を1問取得 */
export async function loadQuestion(
  round: ExamRound,
  number: number,
): Promise<Question | undefined> {
  const data = await loadRound(round);
  return data.questions.find((q) => q.number === number);
}

/** 利用可能な試験回の一覧（古い順） */
export function getAvailableRounds(): readonly ExamRound[] {
  return EXAM_ROUNDS;
}

/** 指定回・指定セッションの問題を取得（"all" は全150問） */
export async function loadSession(
  round: ExamRound,
  session: Session | "all",
): Promise<Question[]> {
  const data = await loadRound(round);
  if (session === "all") return data.questions;
  return data.questions.filter((q) => q.session === session);
}

/** 全1500問を1つのフラットな配列で取得（ランダム出題用） */
export const loadAllQuestions = cache(async (): Promise<Question[]> => {
  const rounds = await loadAllRounds();
  return rounds.flatMap((r) => r.questions);
});
