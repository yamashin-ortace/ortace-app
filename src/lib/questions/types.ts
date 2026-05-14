/**
 * 過去問データの型定義
 *
 * JSON ソース（public/questions/questions_XXkai.json）は日本語キーで保存されているが、
 * TypeScript 上では英語プロパティで扱う（ローダー側でマッピング）。
 */

/** 過去問の収録回（第47〜56回・10年分） */
export const EXAM_ROUNDS = [47, 48, 49, 50, 51, 52, 53, 54, 55, 56] as const;
export type ExamRound = (typeof EXAM_ROUNDS)[number];

/** 出題形式 */
export type QuestionFormat = "1択" | "2択" | "組み合わせ";

/** 選択肢キー（1〜5） */
export type ChoiceKey = "1" | "2" | "3" | "4" | "5";
export type Choices = Partial<Record<ChoiceKey, string>>;

/** 大分類（分野）— 9種類 */
export const FIELDS = [
  "基礎医学・解剖学",
  "弱視・視能訓練",
  "両眼視・斜視",
  "視能検査・検査機器",
  "眼光学・視力学・計算",
  "視野・電気生理・色覚",
  "眼科疾患・神経眼科",
  "法規・制度・医療倫理",
  "症例問題",
] as const;
export type Field = (typeof FIELDS)[number];

/** 午前・午後 */
export type Session = "am" | "pm";

/** 1問分のデータ */
export type Question = {
  /** 安定ID（"47-1" 〜 "56-175"） */
  id: string;
  /** 試験回（47〜56） */
  round: ExamRound;
  /**
   * 公式の問番号（午前1〜75・午後101〜175）。
   * 100の位の「1」は午後を識別するための内部マーカー。
   */
  number: number;
  /**
   * 表示用の問番号（1〜75）。午前はそのまま、午後は number-100。
   * UI上はこちらを使う。
   */
  displayNumber: number;
  /** 午前/午後 */
  session: Session;
  /** 分野（大分類と通常一致） */
  field: string;
  /** テーマ（細分類） */
  theme: string;
  /** 問題文 */
  questionText: string;
  /** 選択肢 {"1": "...", "2": "...", ...} */
  choices: Choices;
  /** 正答キー（"4" や "1,3" のように カンマ区切り） */
  correctAnswer: string;
  /** 正答キーを配列化したもの（["4"] や ["1","3"]） */
  correctAnswers: ChoiceKey[];
  /** 出題形式 */
  format: QuestionFormat;
  /** 大分類 */
  majorCategory: string;
  /** 中分類 */
  minorCategory: string;
  /** 解説 */
  explanation: string;
  /** 画像ファイル名（拡張子.webp）。public/question-images/ 配下に配置 */
  images?: string[];
};

/** 公式正答があり、ユーザーの正誤・弱点判定に使える問題か */
export function isScorableQuestion(question: Pick<Question, "correctAnswers">): boolean {
  return question.correctAnswers.length > 0;
}

/** 1回分のデータ（150問） */
export type RoundData = {
  round: ExamRound;
  questions: Question[];
};

/** JSON ソース上の生データ型（日本語キー） */
export type RawQuestion = {
  回: number;
  問番号: number;
  分野: string;
  テーマ: string;
  問題文: string;
  選択肢: Record<string, string>;
  正答: string;
  出題形式: string;
  大分類: string;
  中分類: string;
  解説: string;
  画像?: string[];
};
