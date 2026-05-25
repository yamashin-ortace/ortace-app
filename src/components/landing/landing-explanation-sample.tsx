import {
  BookOpenText,
  Calculator,
  CheckCircle2,
  Lightbulb,
  XCircle,
} from "lucide-react";

const SAMPLE_CHOICES = [
  {
    key: "1",
    text: "選択肢A",
    verdict: "誤り",
    reason: "ここに、どの条件を見落とすと誤答になるかを入れます。",
    correct: false,
  },
  {
    key: "2",
    text: "選択肢B",
    verdict: "誤り",
    reason: "計算式・検査所見・疾患知識のどこがずれるかを短く示します。",
    correct: false,
  },
  {
    key: "3",
    text: "選択肢C",
    verdict: "正答",
    reason: "正答に至る根拠を、問題文のどの情報から読むかまで分解します。",
    correct: true,
  },
  {
    key: "4",
    text: "選択肢D",
    verdict: "誤り",
    reason: "似た概念との違いを明確にし、次に迷わない形で整理します。",
    correct: false,
  },
  {
    key: "5",
    text: "選択肢E",
    verdict: "誤り",
    reason: "国家試験で狙われやすい引っかけポイントを補足します。",
    correct: false,
  },
] as const;

const CALCULATION_STEPS = [
  "問題文から使う数値・条件だけを抜き出す",
  "公式に代入し、単位をそろえて途中式を書く",
  "選択肢と照合し、近い値ではなく根拠が合うものを選ぶ",
] as const;

export function LandingExplanationSample() {
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
          ORT ACEでは、なぜその選択肢が違うのか、どこで判断するのかまで確認できます。下の内容は、やましんが後で難問1問に差し替えるためのサンプル枠です。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
        <article className="rounded-[16px] border border-border bg-[var(--bg-card)] p-5 shadow-[0_14px_36px_rgba(44,62,93,0.07)]">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              <BookOpenText className="size-4.5" strokeWidth={2.4} aria-hidden />
            </span>
            <p className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--primary-dark)]">
              SAMPLE QUESTION
            </p>
          </div>
          <h3 className="mt-4 text-[18px] font-extrabold leading-[1.5] text-[var(--text-1)]">
            神経眼科・計算問題のサンプル
          </h3>
          <p className="mt-3 text-[13px] leading-[1.9] text-[var(--text-2)]">
            ここに問題文が入ります。検査値、所見、条件を読み取り、選択肢から最も適切なものを選ぶ形式を想定しています。
          </p>
          <div className="mt-4 grid gap-2">
            {SAMPLE_CHOICES.map((choice) => (
              <div
                key={choice.key}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-[var(--bg-base)] px-3 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--bg-muted)] text-[12px] font-extrabold text-[var(--text-2)]">
                  {choice.key}
                </span>
                <p className="text-[13px] font-bold text-[var(--text-1)]">
                  {choice.text}
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
                正答: 3
              </h3>
            </div>
            <span className="rounded-full bg-[#e8f7f5] px-3 py-1 text-[11px] font-bold text-[#16717c]">
              選択肢ごとに確認
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {SAMPLE_CHOICES.map((choice) => {
              const Icon = choice.correct ? CheckCircle2 : XCircle;
              return (
                <div
                  key={choice.key}
                  className="grid gap-2 rounded-[12px] border border-border bg-[var(--bg-base)] px-3 py-3 sm:grid-cols-[92px_minmax(0,1fr)]"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={
                        choice.correct
                          ? "size-4.5 text-emerald-600"
                          : "size-4.5 text-[var(--text-4)]"
                      }
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="text-[12px] font-extrabold text-[var(--text-1)]">
                      {choice.key} {choice.verdict}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
                    {choice.reason}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[12px] bg-[#f0fbf8] p-3 dark:bg-[#11332f]">
              <div className="flex items-center gap-2">
                <Calculator className="size-4 text-[#16717c]" strokeWidth={2.5} />
                <p className="text-[12px] font-extrabold text-[var(--text-1)]">
                  計算過程
                </p>
              </div>
              <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-[var(--text-2)]">
                {CALCULATION_STEPS.map((step, index) => (
                  <li key={step}>
                    <span className="font-bold text-[#16717c]">
                      Step {index + 1}.
                    </span>{" "}
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-[12px] bg-[#fff7e8] p-3 dark:bg-[#3a2a12]">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[#8a5a18]" strokeWidth={2.5} />
                <p className="text-[12px] font-extrabold text-[var(--text-1)]">
                  補足
                </p>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-2)]">
                試験で同様のパターンが出たとき、どの所見に着目すべきかを最後にまとめます。
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
