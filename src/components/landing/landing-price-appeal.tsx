import { CheckCircle2 } from "lucide-react";

export function LandingPriceAppeal() {
  return (
    <>
      {/* ── セクション①：国試対策パック ── */}
      <section
        className="overflow-hidden rounded-[24px] bg-[var(--primary-soft)] px-5 py-14 dark:bg-[rgba(180,80,100,0.06)] md:px-8"
        aria-labelledby="landing-price-appeal-exam-heading"
      >
      <div className="space-y-5">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--primary-dark)]">
            国試対策パック
          </p>
          <h2
            id="landing-price-appeal-exam-heading"
            className="text-[24px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[30px]"
          >
            9,800円は、高いか。安いか。
          </h2>
        </div>

        {/* 1日あたりコスト（文章） */}
        <p className="text-[13px] font-medium leading-[1.85] text-[var(--text-2)]">
          180日前に始めれば約54円/日、90日前なら約109円/日。早く始めるほど、1日あたりのコストは小さくなります。
        </p>

        {/* 強調 */}
        <p className="text-[17px] font-extrabold leading-snug text-[var(--text-1)]">
          一番賢い使い方は、早く始めることだけです。
        </p>

        {/* コピーブロック */}
        <div className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_8px_24px_rgba(44,62,93,0.05)]">
          <p className="text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            9,800円が高く感じるなら、こう考えてみてください。もし来年も同じ試験を受けることになったら、失うのはお金だけじゃありません。
          </p>
          <p className="mt-3 text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            同期が臨床で経験を積んでいく1年間。視能訓練士として働きはじめられたはずの時間。その1年は、取り戻せません。
          </p>
          <p className="mt-3 text-[14px] font-extrabold text-[var(--text-1)]">
            時間は、お金より大切なリソースです。
          </p>
          <p className="mt-3 text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            それでも不安なら、合格サポート保証があります。20日以上学習して不合格なら、翌年は無料。つまり最悪でも、9,800円が2年分になります。
          </p>
        </div>

        {/* 登録誘導 */}
        <div className="rounded-[16px] border border-[var(--primary)]/40 bg-[var(--bg-card)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_16px_rgba(44,62,93,0.08),0_12px_32px_rgba(44,62,93,0.05)]">
          <p className="text-[16px] font-extrabold leading-snug text-[var(--text-1)]">
            まず、14日間だけ使ってみてください。
          </p>
          <p className="mt-2 text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            登録は3分。合わなければやめればいい。続けたいと思ったら、そのまま続ければいい。始めるのに、理由はそれだけで十分です。
          </p>
        </div>
      </div>
      </section>

      {/* ── セクション②：基礎定着パス ── */}
      <section
        className="mt-3 overflow-hidden rounded-[24px] bg-[#edf9f8] px-5 py-14 dark:bg-[rgba(22,113,124,0.08)] md:px-8"
        aria-labelledby="landing-price-appeal-low-heading"
      >
      <div className="space-y-5">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c] dark:text-[#9ee8e0]">
            基礎定着パス
          </p>
          <h2
            id="landing-price-appeal-low-heading"
            className="text-[24px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[30px]"
          >
            受験学年になったとき、
            <br className="sm:hidden" />
            スタートラインが違う。
          </h2>
        </div>

        {/* プラン価格（文章） */}
        <p className="text-[13px] font-medium leading-[1.85] text-[var(--text-2)]">
          3ヶ月¥1,500から始められます。今から積み上げたい方には、1年¥4,800がおすすめです。
        </p>

        {/* データ引き継ぎ安心メモ */}
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-3)]">
          <CheckCircle2 className="size-3.5 shrink-0 text-[#16717c]" strokeWidth={2.5} aria-hidden />
          国試対策パックに移行しても、これまでの学習データはすべて引き継がれます。
        </p>

        {/* 強調 */}
        <p className="text-[17px] font-extrabold leading-snug text-[var(--text-1)]">
          1年プランなら、1ヶ月400円。1日あたり約13円。
        </p>

        {/* コピーブロック */}
        <div className="rounded-[14px] border border-border bg-[var(--bg-card)] p-4 shadow-[0_8px_24px_rgba(44,62,93,0.05)]">
          <p className="text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            国試対策は、受験学年から始めるものだと思っていませんか。同じ受験学年でも、積み上げてきた人とそうでない人では、スタートラインがすでに違います。
          </p>
          <p className="mt-3 text-[14px] font-extrabold text-[var(--text-1)]">
            焦らず、でも着実に。
          </p>
          <p className="mt-3 text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            授業で習ったその日に、少しだけ確認する。それだけで、受験学年の自分が変わります。
          </p>
        </div>

        {/* 登録誘導 */}
        <div className="rounded-[16px] border border-[#9ee8e0]/60 bg-[var(--bg-card)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_16px_rgba(22,113,124,0.06),0_12px_32px_rgba(22,113,124,0.04)]">
          <p className="text-[16px] font-extrabold leading-snug text-[var(--text-1)]">
            まず、1問だけ解いてみてください。
          </p>
          <p className="mt-2 text-[13px] font-medium leading-[1.9] text-[var(--text-2)]">
            誰に言われたわけでもなく、今日も一問解いた。その積み重ねが、受験学年になったときの自信になっています。
          </p>
        </div>
      </div>
      </section>
    </>
  );
}
