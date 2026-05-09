"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import type { Question } from "@/lib/questions";

type Props = {
  question: Question;
};

/**
 * 問題文＋画像トグルボタン
 *
 * 画像はデフォルト非表示。「画像を見る」ボタンで全画面オーバーレイ表示。
 * オーバーレイ内では画像を指追従でスクロール可能。背景はスクロールロック。
 * 軽くタップ（ドラッグなし）で閉じる、または右上の✕ボタンで閉じる。
 */
export function QuestionView({ question }: Props) {
  const [imageOpen, setImageOpen] = useState(false);
  const hasImages = (question.images?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <p className="text-[16px] leading-7 font-medium text-[var(--text-1)] whitespace-pre-wrap">
        {question.questionText}
      </p>

      {hasImages ? (
        <button
          type="button"
          onClick={() => setImageOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--primary-dark)] transition-colors hover:bg-[var(--primary-soft)]/70"
        >
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          画像を見る
          {(question.images?.length ?? 0) > 1
            ? `（${question.images?.length}枚）`
            : ""}
        </button>
      ) : null}

      {imageOpen && question.images ? (
        <ImageOverlay
          images={question.images}
          onClose={() => setImageOpen(false)}
        />
      ) : null}
    </div>
  );
}

const TAP_THRESHOLD_PX = 8;

function ImageOverlay({
  images,
  onClose,
}: {
  images: string[];
  onClose: () => void;
}) {
  const startYRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  // body スクロールロック
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // ESCキーでも閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    movedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    if (Math.abs(e.clientY - startYRef.current) > TAP_THRESHOLD_PX) {
      movedRef.current = true;
    }
  };

  const handlePointerUp = () => {
    const wasTap = startYRef.current !== null && !movedRef.current;
    startYRef.current = null;
    if (wasTap) onClose();
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        startYRef.current = null;
      }}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="画像を表示中"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[var(--text-1)] shadow-lg transition-transform hover:scale-105"
        aria-label="画像を閉じる"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <div className="flex flex-col items-center gap-4 px-4 py-12">
        {images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={`/question-images/${src}`}
            alt=""
            draggable={false}
            className="h-auto w-full max-w-[800px] select-none object-contain"
          />
        ))}
        <p className="pt-2 pb-6 text-center text-[11px] tracking-wider text-white/60">
          タップで閉じる ・ スワイプでスクロール
        </p>
      </div>
    </div>
  );
}
