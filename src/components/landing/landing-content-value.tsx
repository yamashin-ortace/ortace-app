const STATS = [
  { number: "10年分", label: "第47〜56回すべて収録" },
  { number: "1,500問", label: "解説・画像問題つき" },
  { number: "¥9,800", label: "国試対策パック（買い切り）" },
] as const;

export function LandingContentValue() {
  return (
    <section
      className="relative mb-3 overflow-hidden rounded-[24px] bg-[#edf9f8] px-5 py-14 dark:bg-[rgba(22,113,124,0.08)] md:px-8"
      aria-labelledby="landing-content-value-heading"
    >
      {/* 装飾：ティールグロー */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-[#9ee8e0]/30 blur-3xl dark:bg-[#9ee8e0]/10"
        aria-hidden
      />

      <div className="relative space-y-8">
        {/* ── ヘッダー ── */}
        <div className="space-y-3 text-center md:text-left">
          <p className="text-[12px] font-extrabold tracking-[0.12em] text-[#16717c] dark:text-[#9ee8e0]">
            WHY ORT ACE
          </p>
          <h2
            id="landing-content-value-heading"
            className="text-[24px] font-extrabold leading-[1.4] text-[var(--text-1)] md:text-[30px]"
          >
            書籍では、揃わない。
          </h2>
          <p className="text-[14px] leading-relaxed text-[var(--text-3)] md:text-[15px]">
            10年分のうち5回分の解説書は、市販されていません。ORT ACEは、その5回分を含む全10年分の解説を収録した、唯一のサービスです。
          </p>
        </div>

        {/* ── 3つの数字 ── */}
        <div className="grid grid-cols-3 gap-2.5 md:gap-4">
          {STATS.map(({ number, label }) => (
            <div
              key={number}
              className="rounded-[16px] border border-border bg-[var(--bg-card)] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_2px_6px_rgba(44,62,93,0.07),0_10px_28px_rgba(44,62,93,0.08),0_28px_48px_rgba(44,62,93,0.04)] md:p-5"
            >
              <p className="text-[18px] font-extrabold leading-tight tabular-nums text-[var(--text-1)] md:text-[26px]">
                {number}
              </p>
              <p className="mt-1.5 text-[10px] font-medium leading-snug text-[var(--text-3)] md:text-[12px]">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── コスト比較メモ ── */}
        <p className="border-l-2 border-[#9ee8e0]/60 pl-3 text-[13px] font-medium leading-relaxed text-[var(--text-3)]">
          市販書籍をすべてそろえると{" "}
          <span className="font-bold">¥17,820以上</span>
          。しかも5回分の解説は書籍では入手できません。
        </p>
      </div>
    </section>
  );
}
