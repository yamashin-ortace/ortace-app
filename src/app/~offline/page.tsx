import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "オフラインです",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col items-center justify-center gap-6 px-4 pb-16 pt-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary-dark)]">
        <CloudOff className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--primary-dark)]">
          OFFLINE
        </p>
        <h1 className="text-[24px] font-extrabold leading-[1.4] text-[var(--text-1)] sm:text-[28px]">
          ネットワークに接続されていません
        </h1>
        <p className="mt-2 text-[14px] leading-[1.85] text-[var(--text-2)]">
          通信が回復してから、もう一度開いてみてください。
          <br />
          一度開いた問題やノートは、オフラインでも見られることがあります。
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_var(--primary-shadow-soft)] transition-opacity hover:opacity-95"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        トップを再読み込み
      </Link>
    </div>
  );
}
