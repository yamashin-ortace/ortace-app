import {
  isConfidentAnswer,
  type AnswerHistoryEntry,
} from "@/lib/answer-history";
import { getLatestEntryByQuestionId } from "@/lib/answer-history/status";
import type { Question } from "@/lib/questions";
import {
  createMidCategoryKey,
  type MidCategoryWeaknessRow,
} from "./mid-category-analysis";

const BASIC_QUESTIONS_PER_CATEGORY = 3;
export const MAX_FOCUSED_WEAK_QUESTION_COUNT = 7;

export function pickOrderedWeakQuestions(
  questions: readonly Question[],
  entries: readonly AnswerHistoryEntry[],
  rows: readonly MidCategoryWeaknessRow[],
  limit: number,
  options: {
    excludedQuestionIds?: ReadonlySet<string>;
  } = {},
): Question[] {
  if (limit <= 0 || rows.length === 0) return [];

  const latest = getLatestEntryByQuestionId(entries);
  const highConfidenceMissIds = getLatestHighConfidenceMissIds(latest);
  const selected: Question[] = [];
  const seen = new Set<string>();
  const rowKeySet = new Set(rows.map((row) => row.categoryKey));
  const questionsByCategory = groupQuestionsByCategory(
    questions.filter((question) => rowKeySet.has(createMidCategoryKey(question))),
  );

  const add = (pool: readonly Question[], max = Number.POSITIVE_INFINITY) => {
    let added = 0;
    for (const question of pool) {
      if (selected.length >= limit || added >= max) break;
      if (seen.has(question.id)) continue;
      selected.push(question);
      seen.add(question.id);
      added += 1;
    }
  };

  for (const row of rows) {
    const categoryQuestions = (questionsByCategory.get(row.categoryKey) ?? []).filter(
      (question) => !options.excludedQuestionIds?.has(question.id),
    );
    const freshPool = rankBySourceOrder(
      categoryQuestions.filter((question) => {
        const result = latest.get(question.id)?.result;
        return result === undefined || result === "no_answer";
      }),
    );
    add(freshPool, BASIC_QUESTIONS_PER_CATEGORY);

    const highConfidenceMissPool = categoryQuestions
      .filter((question) => highConfidenceMissIds.has(question.id))
      .sort((a, b) => {
        const aAnsweredAt = latest.get(a.id)?.answeredAt ?? "";
        const bAnsweredAt = latest.get(b.id)?.answeredAt ?? "";
        if (aAnsweredAt !== bAnsweredAt) return bAnsweredAt.localeCompare(aAnsweredAt);
        return compareQuestionSource(a, b);
      });
    add(highConfidenceMissPool);

    const otherMissPool = categoryQuestions
      .filter(
        (question) =>
          latest.get(question.id)?.result === "incorrect" &&
          !highConfidenceMissIds.has(question.id),
      )
      .sort((a, b) => {
        const aAnsweredAt = latest.get(a.id)?.answeredAt ?? "";
        const bAnsweredAt = latest.get(b.id)?.answeredAt ?? "";
        if (aAnsweredAt !== bAnsweredAt) return aAnsweredAt.localeCompare(bAnsweredAt);
        return compareQuestionSource(a, b);
      });
    add(otherMissPool);

    add(freshPool);
  }

  return selected;
}

function getLatestHighConfidenceMissIds(
  latest: ReadonlyMap<string, AnswerHistoryEntry>,
): Set<string> {
  const ids = new Set<string>();
  for (const entry of latest.values()) {
    if (entry.result === "incorrect" && isConfidentAnswer(entry)) {
      ids.add(entry.id);
    }
  }
  return ids;
}

function groupQuestionsByCategory(
  questions: readonly Question[],
): Map<string, Question[]> {
  const grouped = new Map<string, Question[]>();
  for (const question of questions) {
    const key = createMidCategoryKey(question);
    const bucket = grouped.get(key) ?? [];
    bucket.push(question);
    grouped.set(key, bucket);
  }
  return grouped;
}

function rankBySourceOrder(questions: readonly Question[]): Question[] {
  return [...questions].sort(compareQuestionSource);
}

function compareQuestionSource(a: Question, b: Question): number {
  if (a.round !== b.round) return a.round - b.round;
  if (a.session !== b.session) return a.session === "am" ? -1 : 1;
  return a.displayNumber - b.displayNumber;
}
