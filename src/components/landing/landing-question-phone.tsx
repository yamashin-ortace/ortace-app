"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SCREENS = [
  {
    src: "/landing/app-screens/v2/home-overview.jpg",
    alt: "ホーム画面：AIコーチMiLu先生の提案と今日のおすすめ、復習が表示されている画面",
    caption: "今日の提案",
  },
  {
    src: "/landing/app-screens/v2/ai-result-analysis.jpg",
    alt: "演習結果画面：AIコーチMiLu先生が次に確認したいテーマを分析している画面",
    caption: "解答後のAI分析",
  },
  {
    src: "/landing/app-screens/v2/weak-analysis.jpg",
    alt: "苦手克服画面：中分類ごとの正答率と反復ミスを分析している画面",
    caption: "苦手の深掘り",
  },
  {
    src: "/landing/app-screens/v2/records-bookmarks.jpg",
    alt: "記録画面：タグを付けて保存した問題を見返せる画面",
    caption: "残して見返す",
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
      const index = Math.round(container.scrollLeft / container.clientWidth);
      setActiveIndex(Math.max(0, Math.min(index, SCREENS.length - 1)));
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

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const nextIndex = Math.max(0, Math.min(index, SCREENS.length - 1));
    container.scrollTo({
      left: nextIndex * container.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[330px] flex-col items-center gap-4">
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
        <div className="absolute inset-[9px] overflow-hidden rounded-[35px] bg-[#fbf6f4]">
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
                  sizes="330px"
                  className="object-cover object-top"
                />
              </div>
            ))}
          </div>
        </div>

        <PhoneArrow
          label="前の画面へ"
          side="left"
          disabled={activeIndex === 0}
          onClick={() => scrollToIndex(activeIndex - 1)}
        >
          <ChevronLeft className="size-4.5" strokeWidth={2.6} />
        </PhoneArrow>
        <PhoneArrow
          label="次の画面へ"
          side="right"
          disabled={activeIndex >= SCREENS.length - 1}
          onClick={() => scrollToIndex(activeIndex + 1)}
        >
          <ChevronRight className="size-4.5" strokeWidth={2.6} />
        </PhoneArrow>

      </div>

      {/* カルーセル下のドット + ラベル */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {SCREENS.map((screen, index) => (
            <span
              key={screen.src}
              className={
                index === activeIndex
                  ? "h-1.5 w-6 rounded-full bg-[var(--primary)] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-[var(--text-3)]/30 transition-all hover:bg-[var(--text-3)]/55"
              }
            />
          ))}
        </div>
        <p className="text-[11px] font-bold text-[var(--text-3)]">
          {SCREENS[activeIndex]?.caption ?? SCREENS[0].caption}
        </p>
      </div>
    </div>
  );
}

function PhoneArrow({
  label,
  side,
  disabled,
  onClick,
  children,
}: {
  label: string;
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "btn-pressable absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#102338] shadow-[0_16px_36px_rgba(15,23,42,0.18)] backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex",
        side === "left" ? "-left-4" : "-right-4",
      )}
    >
      {children}
    </button>
  );
}
