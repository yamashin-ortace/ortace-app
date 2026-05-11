/**
 * 本試験（ORT国家試験）の分野別出題数（仮の推定値）。
 *
 * - 合計は 150 点（午前75問 + 午後75問）。
 * - 各分野の正確な出題数は公式未公表なので、過去問の出題傾向から推定した目安値。
 * - 公式の最新分布が判明したらこの定数だけ差し替えれば、推定スコアの精度が上がる。
 */

import { FIELDS, type Field } from "@/lib/questions";

export const MAX_EXAM_SCORE = 150;

export const EXAM_FIELD_DISTRIBUTION: Record<Field, number> = {
  "基礎医学・解剖学": 18,
  "弱視・視能訓練": 18,
  "両眼視・斜視": 22,
  "視能検査・検査機器": 22,
  "眼光学・視力学・計算": 12,
  "視野・電気生理・色覚": 16,
  "眼科疾患・神経眼科": 28,
  "法規・制度・医療倫理": 6,
  症例問題: 8,
};

// 上記の合計が 150 になっているか開発時に検証するためのテスト用合計値。
export const EXAM_FIELD_DISTRIBUTION_TOTAL = FIELDS.reduce(
  (sum, field) => sum + (EXAM_FIELD_DISTRIBUTION[field] ?? 0),
  0,
);

/**
 * 合格圏ライン（仮）。最終値はリリース前に確定する。
 * 150点中 95 点 ≒ 63% を合格圏とする。
 */
export const DEFAULT_PASS_LINE_SCORE = 95;
