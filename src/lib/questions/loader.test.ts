/**
 * 過去問データのデータ整合性テスト
 *
 * 純粋なヘルパー関数の動作検証 + 実JSONを読み込んだ整合性検査。
 * 1500問すべての構造が壊れていないかをここで担保する。
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildQuestionId,
  getAvailableRounds,
  isExamRound,
  loadAllRounds,
  loadQuestion,
  loadRound,
  sessionOf,
} from "./loader";
import { EXAM_ROUNDS } from "./types";

describe("isExamRound", () => {
  it("47〜56は有効", () => {
    for (const r of EXAM_ROUNDS) {
      expect(isExamRound(r)).toBe(true);
    }
  });
  it("範囲外は無効", () => {
    expect(isExamRound(46)).toBe(false);
    expect(isExamRound(57)).toBe(false);
    expect(isExamRound("47")).toBe(false);
    expect(isExamRound(null)).toBe(false);
  });
});

describe("sessionOf", () => {
  it("1〜75は午前", () => {
    expect(sessionOf(1)).toBe("am");
    expect(sessionOf(75)).toBe("am");
  });
  it("101〜175は午後（100の位の1が午後マーカー）", () => {
    expect(sessionOf(101)).toBe("pm");
    expect(sessionOf(175)).toBe("pm");
  });
});

describe("buildQuestionId", () => {
  it("回-番号 形式", () => {
    expect(buildQuestionId(47, 1)).toBe("47-1");
    expect(buildQuestionId(56, 175)).toBe("56-175");
  });
});

describe("getAvailableRounds", () => {
  it("第47〜56回の10回分", () => {
    expect(getAvailableRounds()).toEqual([47, 48, 49, 50, 51, 52, 53, 54, 55, 56]);
  });
});

describe("loadRound (実データ)", () => {
  it("第47回が150問読み込める", async () => {
    const data = await loadRound(47);
    expect(data.round).toBe(47);
    expect(data.questions).toHaveLength(150);
  });

  it("正規化された問題が必須フィールドを持つ", async () => {
    const data = await loadRound(47);
    const q = data.questions[0];
    expect(q.id).toBe("47-1");
    expect(q.round).toBe(47);
    expect(q.number).toBe(1);
    expect(q.displayNumber).toBe(1);
    expect(q.session).toBe("am");
    expect(q.questionText.length).toBeGreaterThan(0);
    expect(q.explanation.length).toBeGreaterThan(0);
    expect(q.correctAnswers.length).toBeGreaterThan(0);
  });

  it("午後問題の displayNumber は number-100 で1〜75", async () => {
    const data = await loadRound(47);
    const pm = data.questions.find((q) => q.session === "pm");
    expect(pm).toBeDefined();
    expect(pm!.number).toBeGreaterThanOrEqual(101);
    expect(pm!.displayNumber).toBe(pm!.number - 100);
    expect(pm!.displayNumber).toBeGreaterThanOrEqual(1);
    expect(pm!.displayNumber).toBeLessThanOrEqual(75);
  });

  it("複数正答 (2択問題) を配列化できる", async () => {
    const data = await loadRound(47);
    const two = data.questions.find((q) => q.format === "2択");
    expect(two).toBeDefined();
    expect(two!.correctAnswers.length).toBe(2);
    // カンマ区切り文字列としても保持されている
    expect(two!.correctAnswer).toMatch(/^\d,\d$/);
  });
});

describe("loadAllRounds (1500問の整合性)", () => {
  it("10回分が読み込める", async () => {
    const all = await loadAllRounds();
    expect(all).toHaveLength(10);
    const totalQuestions = all.reduce((sum, r) => sum + r.questions.length, 0);
    expect(totalQuestions).toBe(1500);
  });

  it("全問にIDが一意に割り当たる", async () => {
    const all = await loadAllRounds();
    const ids = all.flatMap((r) => r.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(1500);
  });

  it("全問の正答が選択肢として実在する", async () => {
    const all = await loadAllRounds();
    for (const round of all) {
      for (const q of round.questions) {
        for (const ans of q.correctAnswers) {
          expect(q.choices[ans], `${q.id} 正答${ans}が選択肢に存在`).toBeDefined();
        }
      }
    }
  });

  it("画像参照が public/question-images/ 配下に実在する", async () => {
    const all = await loadAllRounds();
    const imagesDir = path.join(process.cwd(), "public", "question-images");
    const existingFiles = new Set(await fs.readdir(imagesDir));
    for (const round of all) {
      for (const q of round.questions) {
        for (const img of q.images ?? []) {
          expect(existingFiles.has(img), `${q.id} の画像 ${img} が存在`).toBe(true);
        }
      }
    }
  });

  // 公式の出題ミスにより1択でも複数正答が成立する3件
  const KNOWN_AMBIGUOUS_ANSWERS = new Set(["47-62", "48-61", "51-131"]);

  // 試験委員会により出題ミス認定され正答が確定していない10件
  const KNOWN_NO_ANSWER = new Set([
    "48-145",
    "49-136",
    "50-164",
    "51-139",
    "52-25",
    "53-167",
    "54-34",
    "55-152",
    "56-1",
    "56-37",
  ]);

  it("出題形式と正答数が整合する（公式の出題ミスは例外として明示）", async () => {
    const all = await loadAllRounds();
    for (const round of all) {
      for (const q of round.questions) {
        if (KNOWN_NO_ANSWER.has(q.id)) {
          expect(q.correctAnswers.length, `${q.id} 正答未確定`).toBe(0);
          continue;
        }
        if (KNOWN_AMBIGUOUS_ANSWERS.has(q.id)) {
          expect(q.format).toBe("1択");
          expect(q.correctAnswers.length).toBe(2);
          continue;
        }
        if (q.format === "1択") {
          expect(q.correctAnswers.length, `${q.id}`).toBe(1);
        } else if (q.format === "2択") {
          expect(q.correctAnswers.length, `${q.id}`).toBe(2);
        } else if (q.format === "組み合わせ") {
          // 組み合わせは通常1正答だが、「2つ選べ」と指示する場合は2正答
          expect(q.correctAnswers.length, `${q.id}`).toBeGreaterThanOrEqual(1);
          expect(q.correctAnswers.length, `${q.id}`).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});

describe("loadQuestion", () => {
  it("第56回 問1が取得できる", async () => {
    const q = await loadQuestion(56, 1);
    expect(q?.id).toBe("56-1");
    expect(q?.number).toBe(1);
  });

  it("存在しない番号は undefined", async () => {
    const q = await loadQuestion(56, 999);
    expect(q).toBeUndefined();
  });
});
