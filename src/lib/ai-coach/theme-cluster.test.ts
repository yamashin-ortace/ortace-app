import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/questions";
import {
  AI_THEME_CLUSTERS,
  getAiThemeKey,
  getAiThemeLabel,
} from "./theme-cluster";

describe("AI theme cluster", () => {
  it("AIコーチ用クラスタは50前後に収める", () => {
    expect(AI_THEME_CLUSTERS.length).toBeGreaterThanOrEqual(45);
    expect(AI_THEME_CLUSTERS.length).toBeLessThanOrEqual(55);
  });

  it("緑内障の視野系テーマは視野変化クラスタに寄せる", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "眼科疾患・神経眼科",
          minorCategory: "緑内障",
          theme: "緑内障視野欠損",
        }),
      ),
    ).toBe("緑内障と視野変化");
  });

  it("緑内障でも視野以外は臨床クラスタに寄せる", () => {
    expect(
      getAiThemeKey(
        question({
          majorCategory: "眼科疾患・神経眼科",
          minorCategory: "緑内障",
          theme: "急性緑内障発作",
        }),
      ),
    ).toBe("glaucoma-clinical");
  });

  it("似たぶどう膜炎テーマは同じクラスタへ寄せる", () => {
    const a = question({
      majorCategory: "眼科疾患・神経眼科",
      minorCategory: "ぶどう膜炎・免疫疾患",
      theme: "Vogt-小柳-原田病",
    });
    const b = question({
      majorCategory: "基礎医学・解剖学",
      minorCategory: "免疫・病理",
      theme: "サルコイドーシス",
    });

    expect(getAiThemeKey(a)).toBe(getAiThemeKey(b));
  });
});

function question(overrides: Partial<Question>): Question {
  return {
    id: "56-1",
    round: 56,
    number: 1,
    displayNumber: 1,
    session: "am",
    field: "眼科疾患・神経眼科",
    theme: "緑内障",
    questionText: "問題文",
    choices: { "1": "A", "2": "B" },
    correctAnswer: "1",
    correctAnswers: ["1"],
    format: "1択",
    majorCategory: "眼科疾患・神経眼科",
    minorCategory: "緑内障",
    explanation: "解説",
    ...overrides,
  };
}
