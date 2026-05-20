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
    expect(AI_THEME_CLUSTERS.length).toBeLessThanOrEqual(60);
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

  it("複視は神経麻痺性斜視クラスタに寄せる", () => {
    expect(
      getAiThemeKey(
        question({
          majorCategory: "両眼視・斜視",
          minorCategory: "複視",
          theme: "同側性複視",
        }),
      ),
    ).toBe("paralytic-strabismus");
  });

  it("眼振と代償頭位はAIコーチ上で別テーマとして扱う", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "両眼視・斜視",
          minorCategory: "眼振",
          theme: "眼振",
        }),
      ),
    ).toBe("眼振");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "両眼視・斜視",
          minorCategory: "頭位異常・代償頭位",
          theme: "代償頭位",
        }),
      ),
    ).toBe("頭位異常・代償頭位");
  });

  it("外眼筋の神経支配は眼球運動の法則から分ける", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "両眼視・斜視",
          minorCategory: "眼球運動・法則",
          theme: "外眼筋神経支配",
        }),
      ),
    ).toBe("外眼筋の神経支配");
  });

  it("計算系と弱視系はユーザーに伝わりやすいクラスタ名にする", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "眼光学・視力学・計算",
          minorCategory: "視力・視角計算",
          theme: "調節力計算",
        }),
      ),
    ).toBe("視力・視角・調節力計算");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "弱視・視能訓練",
          minorCategory: "弱視の分類・原因",
          theme: "不同視弱視",
        }),
      ),
    ).toBe("弱視");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "眼光学・視力学・計算",
          minorCategory: "眼内レンズ・手術光学",
          theme: "IOL度数計算",
        }),
      ),
    ).toBe("眼内レンズ度数計算");
  });

  it("眼の発生と正常値は本文テーマに応じて分ける", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "基礎医学・解剖学",
          minorCategory: "眼の発生・生理的計測値",
          theme: "網膜の発生起源",
        }),
      ),
    ).toBe("眼の発生");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "基礎医学・解剖学",
          minorCategory: "眼の発生・生理的計測値",
          theme: "涙液の特性",
        }),
      ),
    ).toBe("涙液・涙膜");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "基礎医学・解剖学",
          minorCategory: "眼の発生・生理的計測値",
          theme: "角膜厚の正常値",
        }),
      ),
    ).toBe("角膜の特性・計測");
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "基礎医学・解剖学",
          minorCategory: "眼の発生・生理的計測値",
          theme: "眼球計測値",
        }),
      ),
    ).toBe("眼球計測・正常値");
  });

  it("QOVは眼振ではなく視覚の質として扱う", () => {
    expect(
      getAiThemeLabel(
        question({
          majorCategory: "両眼視・斜視",
          minorCategory: "眼振",
          theme: "QOV",
        }),
      ),
    ).toBe("コントラスト感度・視覚の質");
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
    expect(getAiThemeLabel(a)).toBe("ぶどう膜炎");
  });

  it("自己免疫疾患はぶどう膜炎とは別クラスタにする", () => {
    const uveitis = question({
      majorCategory: "眼科疾患・神経眼科",
      minorCategory: "ぶどう膜炎・免疫疾患",
      theme: "サルコイドーシス",
    });
    const autoimmune = question({
      majorCategory: "基礎医学・解剖学",
      minorCategory: "免疫・病理",
      theme: "自己免疫疾患",
    });

    expect(getAiThemeLabel(uveitis)).toBe("ぶどう膜炎");
    expect(getAiThemeLabel(autoimmune)).toBe("自己免疫・膠原病");
    expect(getAiThemeKey(autoimmune)).not.toBe(getAiThemeKey(uveitis));
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
