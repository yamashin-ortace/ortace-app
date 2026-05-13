"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  items: ReactNode[];
  /** カード1枚に与えるクラス（幅・スナップ位置）。既定はモバイルで2枚弱見える幅。 */
  itemClassName?: string;
  /** ドットインジケーター表示（要素が1枚ならどちらにせよ非表示） */
  showDots?: boolean;
  /** スワイプ領域の aria-label */
  ariaLabel?: string;
};

/**
 * 横スワイプ＋スナップする一行カードリスト。
 * - 親が `px-5` でレイアウトされている前提で `-mx-5 px-5` 端まで広げる。
 * - スクロールバーは UI 上隠す（タッチ／トラックパッド前提）。
 */
export function HorizontalSnapRow({
  items,
  itemClassName = "min-w-[44%] basis-[44%] shrink-0 snap-start sm:min-w-[180px] sm:basis-[180px]",
  showDots = true,
  ariaLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const cards = container.querySelectorAll<HTMLElement>("[data-snap-item]");
      if (cards.length === 0) return;
      // snap port は scroll-padding-left の分だけ内側にあるので、その分を差し引いて距離計算する。
      const paddingLeft =
        parseFloat(getComputedStyle(container).paddingLeft) || 0;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      // 右端まで到達したら、視覚的にも最後尾を active にする。
      // snap-start のため、最後のカードは「左端に吸い付かない」場合があり、
      // offsetLeft 距離だけだと一つ前のカードが closest になることがあるため。
      if (maxScrollLeft > 0 && scrollLeft >= maxScrollLeft - 2) {
        setActiveIndex(cards.length - 1);
        return;
      }
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((el, i) => {
        const dist = Math.abs(el.offsetLeft - scrollLeft - paddingLeft);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => {
      container.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items.length]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        // 横スワイプ：
        // - snap-proximity：自由スクロール優先 + 近くまで来たらやさしくスナップ（mandatory より滑らか）
        // - scroll-pl-5：スナップ位置を内側 padding に合わせ、最初のカードが画面端に吸い付くのを防ぐ
        // - scroll-smooth：プログラム的なスクロール時の補間をオン
        className={cn(
          "-mx-5 flex snap-x snap-proximity scroll-pl-5 scroll-smooth gap-3 overflow-x-auto overflow-y-hidden px-5 pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-snap-item
            className={cn("flex [&>*]:w-full", itemClassName)}
          >
            {item}
          </div>
        ))}
      </div>
      {showDots && items.length > 1 ? (
        <div
          className="flex items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-200",
                i === activeIndex
                  ? "w-4 bg-[var(--primary)]"
                  : "w-1.5 bg-[var(--text-3)]/30",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
