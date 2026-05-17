"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pointer } from "lucide-react";

const SCREENS = [
  {
    src: "/landing/app-screens/home-dashboard.jpg",
    alt: "ホーム画面：今日のおすすめ20問とAIコーチMiLu先生からの提案",
    caption: "ホーム",
  },
  {
    src: "/landing/app-screens/study-question.jpg",
    alt: "学習画面：過去問の演習画面",
    caption: "学習",
  },
  {
    src: "/landing/app-screens/ai-analysis.jpg",
    alt: "結果画面：AIコーチMiLu先生による分析と次の演習提案",
    caption: "AI分析",
  },
  {
    src: "/landing/app-screens/records-list.jpg",
    alt: "記録画面：解答履歴・分野別の正答率・苦手なテーマ",
    caption: "記録",
  },
] as const;

/**
 * iPhone 風の正面置きスマホモックアップ。
 * 画面領域を横スワイプ／矢印キーで切り替えられるカルーセル形式。
 */
export function LandingQuestionPhone() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const slides = container.querySelectorAll<HTMLElement>("[data-screen]");
      if (slides.length === 0) return;
      const scrollLeft = container.scrollLeft;
      const slideWidth = container.clientWidth;
      const index = Math.round(scrollLeft / Math.max(slideWidth, 1));
      setActiveIndex(Math.max(0, Math.min(slides.length - 1, index)));
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => {
      container.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const goTo = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
      {/* iPhone フレーム */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "9 / 19.5" }}
      >
        {/* 外殻 */}
        <div className="absolute inset-0 rounded-[44px] bg-linear-to-br from-[#1f2127] via-[#16181d] to-[#0c0d10] shadow-[0_30px_60px_rgba(15,23,42,0.28),0_0_0_2px_rgba(255,255,255,0.06)_inset]" />
        {/* 側面ボタン（音量） */}
        <span className="absolute -left-[3px] top-[18%] h-[42px] w-[3px] rounded-full bg-[#1a1c20]" aria-hidden />
        <span className="absolute -left-[3px] top-[26%] h-[70px] w-[3px] rounded-full bg-[#1a1c20]" aria-hidden />
        <span className="absolute -left-[3px] top-[36%] h-[70px] w-[3px] rounded-full bg-[#1a1c20]" aria-hidden />
        {/* 側面ボタン（電源） */}
        <span className="absolute -right-[3px] top-[24%] h-[96px] w-[3px] rounded-full bg-[#1a1c20]" aria-hidden />

        {/* ベゼル内側＋画面 */}
        <div className="absolute inset-[10px] overflow-hidden rounded-[36px] bg-black">
          {/* Dynamic Island */}
          <div
            className="absolute left-1/2 top-[10px] z-10 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-black"
            aria-hidden
          />
          {/* 画面カルーセル */}
          <div
            ref={containerRef}
            role="region"
            aria-label="アプリ画面ギャラリー"
            className="flex h-full snap-x snap-mandatory scroll-smooth overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SCREENS.map((screen) => (
              <div
                key={screen.src}
                data-screen
                className="relative h-full w-full shrink-0 snap-center"
              >
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  fill
                  unoptimized
                  sizes="300px"
                  className="object-cover object-top"
                  priority={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* タップ指示（指） */}
        <div
          className="pointer-events-none absolute bottom-[10%] right-[14%] grid size-12 place-items-center rounded-full border border-white/70 bg-white/95 text-[#c97896] shadow-[0_14px_32px_rgba(119,53,78,0.28)]"
          aria-hidden
        >
          <Pointer className="size-6 -rotate-12" strokeWidth={2.4} />
        </div>
      </div>

      {/* カルーセル下のドット + ラベル */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="画面を切り替え">
          {SCREENS.map((screen, index) => (
            <button
              key={screen.src}
              type="button"
              onClick={() => goTo(index)}
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`${screen.caption} 画面を表示`}
              className={
                activeIndex === index
                  ? "h-1.5 w-6 rounded-full bg-[var(--primary)] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-[var(--text-3)]/30 transition-all hover:bg-[var(--text-3)]/55"
              }
            />
          ))}
        </div>
        <p className="text-[11px] font-bold text-[var(--text-3)]">
          {SCREENS[activeIndex].caption} ・ 左右にスワイプ
        </p>
      </div>
    </div>
  );
}
