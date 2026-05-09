"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type Props = {
  href: string;
  label: string;
  useHistory?: boolean;
};

/** 学習画面の戻るリンク（共通コンポーネント） */
export function BackLink({ href, label, useHistory = false }: Props) {
  const router = useRouter();

  if (useHistory) {
    return (
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-[12px] text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[12px] text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
    >
      <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
