/**
 * 過去問データの公開API
 *
 * - サーバーコンポーネントからは loader.ts の関数を直接 import
 * - クライアントから使う型は ./types から import
 */
export type {
  ChoiceKey,
  Choices,
  ExamRound,
  Field,
  Question,
  QuestionFormat,
  RoundData,
  Session,
} from "./types";

export { EXAM_ROUNDS, FIELDS } from "./types";
