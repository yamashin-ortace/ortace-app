import { describe, expect, it } from "vitest";
import {
  createAnswerHistoryEntryKey,
  mergeAnswerHistoryStores,
  mergeBookmarksStores,
  mergeDailyLimitRecords,
  mergeNotesStores,
  mergeStudyGoalConfigRecord,
} from ".";
import type {
  AnswerHistoryRow,
  StudyGoalSettingsRow,
} from "@/lib/supabase/database.types";

describe("study sync helpers", () => {
  it("daily limitは同じ日付なら大きいcountを採用する", () => {
    expect(
      mergeDailyLimitRecords(
        { date: "2026-05-08", count: 3 },
        {
          user_id: "user-1",
          date: "2026-05-08",
          count: 8,
          updated_at: "2026-05-08T00:00:00.000Z",
        },
      ),
    ).toEqual({ date: "2026-05-08", count: 8 });
  });

  it("daily limitは基礎定着パスの50問まで同期できる", () => {
    expect(
      mergeDailyLimitRecords(
        { date: "2026-05-08", count: 20 },
        {
          user_id: "user-1",
          date: "2026-05-08",
          count: 50,
          updated_at: "2026-05-08T00:00:00.000Z",
        },
      ),
    ).toEqual({ date: "2026-05-08", count: 50 });
  });

  it("ブックマークはカテゴリを和集合にして追加日時は古い方を残す", () => {
    const merged = mergeBookmarksStores(
      {
        version: 1,
        items: {
          "52-101": {
            addedAt: "2026-05-08T01:00:00.000Z",
            categories: ["weak"],
          },
        },
      },
      [
        {
          user_id: "user-1",
          question_id: "52-101",
          added_at: "2026-05-08T00:00:00.000Z",
          updated_at: "2026-05-08T00:00:00.000Z",
          categories: ["memorize"],
        },
      ],
    );

    expect(merged.items["52-101"]).toEqual({
      addedAt: "2026-05-08T00:00:00.000Z",
      categories: ["weak", "memorize"],
    });
  });

  it("ノートはupdatedAtが新しい方を採用する", () => {
    const merged = mergeNotesStores(
      {
        version: 1,
        items: {
          "52-101": {
            text: "古いメモ",
            updatedAt: "2026-05-08T00:00:00.000Z",
          },
        },
      },
      [
        {
          user_id: "user-1",
          question_id: "52-101",
          text: "新しいメモ",
          updated_at: "2026-05-08T01:00:00.000Z",
        },
      ],
    );

    expect(merged.items["52-101"]).toEqual({
      text: "新しいメモ",
      updatedAt: "2026-05-08T01:00:00.000Z",
    });
  });

  it("解答履歴はentry_key相当で重複を除き新しい順にする", () => {
    const remote: AnswerHistoryRow = {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "user-1",
      entry_key: "52-101|2026-05-08T00:00:00.000Z|correct|1",
      question_id: "52-101",
      answered_at: "2026-05-08T00:00:00.000Z",
      result: "correct",
      selected_answers: ["1"],
      round: 52,
      session: "pm",
      display_number: 1,
      major_category: "眼科疾患・神経眼科",
      confidence: null,
      duration_ms: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };

    const merged = mergeAnswerHistoryStores(
      {
        version: 1,
        entries: [
          {
            id: "52-101",
            answeredAt: "2026-05-08T00:00:00.000Z",
            result: "correct",
            selectedAnswers: ["1"],
            round: 52,
            session: "pm",
            displayNumber: 1,
            majorCategory: "眼科疾患・神経眼科",
          },
          {
            id: "52-102",
            answeredAt: "2026-05-08T01:00:00.000Z",
            result: "incorrect",
            selectedAnswers: ["2"],
            round: 52,
            session: "pm",
            displayNumber: 2,
            majorCategory: "眼科疾患・神経眼科",
          },
        ],
      },
      [remote],
    );

    expect(merged.entries).toHaveLength(2);
    expect(merged.entries[0]?.id).toBe("52-102");
    expect(createAnswerHistoryEntryKey(merged.entries[1]!)).toBe(
      "52-101|2026-05-08T00:00:00.000Z|correct|1",
    );
  });

  it("解答履歴のremote行はDB stored entry_keyをそのまま信頼する", () => {
    const remote: AnswerHistoryRow = {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "user-1",
      entry_key: "db-stored-key-with-format-difference",
      question_id: "52-101",
      answered_at: "2026-05-08T00:00:00.000Z",
      result: "correct",
      selected_answers: ["1"],
      round: 52,
      session: "pm",
      display_number: 1,
      major_category: "眼科疾患・神経眼科",
      confidence: null,
      duration_ms: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };

    const merged = mergeAnswerHistoryStores(
      {
        version: 1,
        entries: [
          {
            id: "52-101",
            answeredAt: "2026-05-08T00:00:00.000Z",
            result: "correct",
            selectedAnswers: ["1"],
            round: 52,
            session: "pm",
            displayNumber: 1,
            majorCategory: "眼科疾患・神経眼科",
          },
        ],
      },
      [remote],
    );

    expect(merged.entries).toHaveLength(2);
  });

  it("解答履歴の自信度と解答時間をremoteから復元する", () => {
    const remote: AnswerHistoryRow = {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "user-1",
      entry_key: "52-103|2026-05-08T02:00:00.000Z|incorrect|2",
      question_id: "52-103",
      answered_at: "2026-05-08T02:00:00.000Z",
      result: "incorrect",
      selected_answers: ["2"],
      round: 52,
      session: "pm",
      display_number: 3,
      major_category: "眼科疾患・神経眼科",
      confidence: "high",
      duration_ms: 12_345,
      created_at: "2026-05-08T02:00:00.000Z",
    };

    const merged = mergeAnswerHistoryStores({ version: 1, entries: [] }, [remote]);

    expect(merged.entries[0]).toMatchObject({
      id: "52-103",
      confidence: "high",
      durationMs: 12_345,
    });
  });

  it("学習プリセットはremoteが新しければremoteを採用する", () => {
    const remote: StudyGoalSettingsRow = {
      user_id: "user-1",
      config: {
        enabled: true,
        scope: "past_plus_original",
        rounds: 2,
        deadline: "exam",
      },
      updated_at: "2026-05-08T01:00:00.000Z",
    };

    const merged = mergeStudyGoalConfigRecord(
      {
        config: {
          enabled: true,
          scope: "past",
          rounds: 1,
          deadline: "1m_before",
        },
        updatedAt: "2026-05-08T00:00:00.000Z",
      },
      remote,
    );

    expect(merged.shouldPush).toBe(false);
    expect(merged.record.config.scope).toBe("past_plus_original");
    expect(merged.record.config.rounds).toBe(2);
  });

  it("学習プリセットはlocalが新しければpush対象にする", () => {
    const remote: StudyGoalSettingsRow = {
      user_id: "user-1",
      config: {
        enabled: false,
        scope: "past",
        rounds: 1,
        deadline: "1m_before",
      },
      updated_at: "2026-05-08T00:00:00.000Z",
    };

    const merged = mergeStudyGoalConfigRecord(
      {
        config: {
          enabled: true,
          scope: "past_plus_original",
          rounds: 3,
          deadline: "custom",
          customDeadlineISO: "2026-12-01",
        },
        updatedAt: "2026-05-08T01:00:00.000Z",
      },
      remote,
    );

    expect(merged.shouldPush).toBe(true);
    expect(merged.record.config.rounds).toBe(3);
    expect(merged.record.config.customDeadlineISO).toBe("2026-12-01");
  });
});
