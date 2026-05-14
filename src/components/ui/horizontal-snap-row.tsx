"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  items: ReactNode[];
  /** カード1枚に与えるクラス（幅・スナップ位置）。既定はモバイルで2枚弱見える幅。 */
  itemClassName?: string;
  /** バーインジケーター表示（要素が1枚ならどちらにせよ非表示） */
  showDots?: boolean;
  /** スワイプ領域の aria-label */
  ariaLabel?: string;
};

/**
 * 横スワイプ＋スナップする一行カードリスト。
 * - 親幅に収めたまま横スクロールし、周囲のカードと左右端を揃える。
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
      // 左右端を親カード幅に揃えるため、実際の padding 分だけ距離計算から差し引く。
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
        // - 親の幅からはみ出さない：周囲のカードと左右端を揃える
        // - scroll-smooth：プログラム的なスクロール時の補間をオン
        className={cn(
          "flex snap-x snap-proximity scroll-smooth gap-3 overflow-x-auto overflow-y-visible py-1",
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
          className="mx-auto h-1 w-20 overflow-hidden rounded-full bg-[var(--text-3)]/18"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-[var(--primary)] transition-transform duration-200 ease-out"
            style={{
              width: `${100 / items.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
