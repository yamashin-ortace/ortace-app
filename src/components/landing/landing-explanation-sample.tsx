"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BookOpenText,
  Calculator,
  CheckCircle2,
  ImageIcon,
  Lightbulb,
  XCircle,
} from "lucide-react";

const SAMPLES = [
  {
    id: "standard",
    tab: "通常問題",
    icon: BookOpenText,
    source: "第56回 午後55",
    title: "眼振を分類する",
    question:
      "後天眼振はどれか。",
    correct: "4",
    choices: [
      ["1", "潜伏眼振", "先天眼振に分類される。"],
      ["2", "終末位眼振", "健常者でも側方視でみられる生理的眼振である。"],
      ["3", "顕性潜伏眼振", "乳児期発症の先天眼振である。"],
      ["4", "輻湊後退眼振", "中脳被蓋障害などで生じる後天眼振である。"],
      ["5", "眼振阻止症候群", "乳児期発症の先天眼振である。"],
    ],
    explanationSections: [
      ["解くポイント", "後天眼振では、神経疾患に伴う輻湊後退眼振を選ぶ。"],
      ["補足", "眼振は先天性か後天性か、病的か生理的かをまず分類する。"],
    ],
  },
  {
    id: "calculation",
    tab: "計算問題",
    icon: Calculator,
    source: "第55回 午前13",
    title: "眼位の符号をそろえる",
    question:
      "瞳孔間距離60mm、完全屈折矯正後に交代プリズム遮閉試験で測定した遠見眼位（5m）は3Δの外斜視、近見眼位（33cm）は6Δの外斜視であった。AC/A比［Δ/D］はどれか。",
    correct: "3",
    choices: [
      ["1", "3", "AC/A比は3Δ/Dではない。"],
      ["2", "4", "AC/A比は4Δ/Dではない。"],
      ["3", "5", "斜位法で計算するとAC/A比は5Δ/Dである。"],
      ["4", "6", "AC/A比は6Δ/Dではない。"],
      ["5", "7", "AC/A比は7Δ/Dではない。"],
    ],
    explanationSections: [
      ["計算結果", "5Δ/D"],
      ["計算過程", "AC/A = PD(cm) + (近見眼位 - 遠見眼位) / 調節量。PD=6cm、遠見=-3Δ、近見=-6Δ、調節量=3Dなので、AC/A = 6 + {-6 - (-3)} / 3 = 6 - 1 = 5Δ/D。"],
      ["計算根拠", "斜位法では内斜視をプラス、外斜視をマイナスとして扱う。"],
      ["補足", "AC/A比は、眼位の符号とPDの単位cmをそろえると計算ミスが減る。"],
    ],
  },
  {
    id: "image",
    tab: "画像問題",
    icon: ImageIcon,
    source: "第56回 午前66",
    title: "Hess赤緑試験を読む",
    question:
      "65歳の男性。2日前より複視を自覚するようになり来院した。糖尿病の既往がある。前眼部、中間透光体および眼底には異常を認めない。Hess赤緑試験の結果を別に示す。誤っているのはどれか。",
    image: "/landing/explanation-samples/56kai-am-q66-hess.webp",
    imageAlt: "左外転神経麻痺を示すHess赤緑試験の結果",
    correct: "1",
    choices: [
      ["1", "複視は右方視で増強する。", "左外転神経麻痺では複視は左方視で増強するため、右方視で増強は誤りである。"],
      ["2", "第1眼位で内斜視を認める。", "第1眼位で内斜視を認める。"],
      ["3", "右眼の内直筋に過動がみられる。", "右眼の内直筋に過動がみられる。"],
      ["4", "左眼の所見は第1偏位を表している。", "左眼の所見は第1偏位を表している。"],
      ["5", "右眼の測定時に赤ガラスは左眼に挿入する。", "右眼測定時には赤ガラスを左眼に挿入する。"],
    ],
    explanationSections: [
      ["解くポイント", "この問題は「誤っているもの」を選ぶ。Hessでは縮小側と拡大側、増悪方向を対応づける。"],
      ["症例の着眼点", "糖尿病既往がある65歳男性で、2日前から複視を自覚している。"],
      ["所見の読み取り", "別冊No.7では左外転神経麻痺を示し、複視は左方視で増強する。"],
      ["補足", "Hess赤緑試験では、麻痺筋方向の運動制限と健眼の過動を対応させて読む。"],
    ],
  },
] as const;

export function LandingExplanationSample() {
  const [activeId, setActiveId] =
    useState<(typeof SAMPLES)[number]["id"]>("standard");
  const sample = SAMPLES.find(({ id }) => id === activeId) ?? SAMPLES[0];

  return (
    <section
      className="space-y-8 py-14"
      aria-labelledby="landing-explanation-sample-heading"
    >
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
          EXPLANATION SAMPLE
        </p>
        <h2
          id="landing-explanation-sample-heading"
          className="text-[24px] font-extrabold text-[var(--text-1)] md:text-[30px]"
        >
          解説は、正解だけで終わらせない。
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
          画像問題、知識問題、計算問題。どの形式でも、なぜ違うか、どこを見るかまで確認できます。
        </p>
      </div>

      <div
        role="tablist"
        aria-label="解説サンプルの種類"
        className="grid gap-2 sm:inline-grid sm:grid-cols-3"
      >
        {SAMPLES.map(({ id, tab, icon: Icon }) => {
          const active = id === activeId;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveId(id)}
              className={
                active
                  ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#102338] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-sm"
                  : "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-[var(--bg-card)] px-4 py-2.5 text-[13px] font-extrabold text-[var(--text-2)] transition-colors hover:bg-[var(--primary-soft)]"
              }
            >
              <Icon className="size-4" strokeWidth={2.4} aria-hidden />
              {tab}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
        <article className="rounded-[16px] border border-border bg-[var(--bg-card)] p-5 shadow-[0_14px_36px_rgba(44,62,93,0.07)]">
          <p className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--primary-dark)]">
            実際の収録問題から抜粋
          </p>
          <p className="mt-3 inline-flex rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--primary-dark)]">
            {sample.source}
          </p>
          <h3 className="mt-3 text-[18px] font-extrabold leading-[1.5] text-[var(--text-1)]">
            {sample.title}
          </h3>
          <p className="mt-3 text-[13px] leading-[1.9] text-[var(--text-2)]">
            {sample.question}
          </p>
          {"image" in sample ? (
            <div className="mt-4 overflow-hidden rounded-[12px] border border-border bg-white">
              <Image
                src={sample.image}
                alt={sample.imageAlt}
                width={1500}
                height={1138}
                unoptimized
                sizes="(min-width: 1024px) 360px, 100vw"
                className="h-auto w-full object-contain"
              />
            </div>
          ) : null}
          <div className="mt-4 grid gap-2">
            {sample.choices.map(([key, text]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-base)] px-3 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--bg-muted)] text-[12px] font-extrabold text-[var(--text-2)]">
                  {key}
                </span>
                <p className="text-[13px] font-bold text-[var(--text-1)]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[16px] border border-[#9ee8e0]/45 bg-[var(--bg-card)] p-5 shadow-[0_14px_36px_rgba(44,62,93,0.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.1em] text-[#16717c]">
                ANSWER WALKTHROUGH
              </p>
              <h3 className="mt-1 text-[18px] font-extrabold text-[var(--text-1)]">
                正答: {sample.correct}
              </h3>
            </div>
            <span className="rounded-full bg-[#e8f7f5] px-3 py-1 text-[11px] font-bold text-[#16717c]">
              選択肢ごとに確認
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {sample.choices.map(([key, , reason]) => {
              const correct = key === sample.correct;
              const Icon = correct ? CheckCircle2 : XCircle;
              return (
                <div
                  key={key}
                  className="grid gap-2 rounded-[12px] border border-border bg-[var(--bg-base)] px-3 py-3 sm:grid-cols-[82px_minmax(0,1fr)]"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={
                        correct
                          ? "size-4.5 text-emerald-600"
                          : "size-4.5 text-[var(--text-4)]"
                      }
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="text-[12px] font-extrabold text-[var(--text-1)]">
                      {key} {correct ? "正答" : "誤り"}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
                    {reason}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-[#16717c]" strokeWidth={2.5} aria-hidden />
              <p className="text-[12px] font-extrabold text-[#16717c]">
                解説全文
              </p>
            </div>
            {sample.explanationSections.map(([label, body]) => (
              <div
                key={label}
                className="rounded-[12px] bg-[#f0fbf8] p-3 dark:bg-[#11332f]"
              >
                <p className="text-[12px] font-extrabold text-[var(--text-1)]">
                  {label}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-2)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
