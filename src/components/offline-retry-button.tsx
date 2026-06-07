"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

export function OfflineRetryButton() {
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState(
    "通信が回復したら、ここからトップへ戻れます。",
  );

  useEffect(() => {
    const updateOnlineState = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setMessage(
        online
          ? "通信が回復しました。ボタンでトップへ戻れます。"
          : "通信はまだ切れています。接続が戻るまで待ってください。",
      );
    };

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  const handleRetry = () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setMessage("まだオフラインです。通信が回復してからもう一度押してください。");
      return;
    }

    window.location.assign("/");
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleRetry}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_var(--primary-shadow-soft)] transition-opacity hover:opacity-95"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        {isOnline ? "トップを再読み込み" : "通信状態を確認"}
      </button>
      <p
        className="min-h-6 text-[12px] font-bold leading-[1.7] text-[var(--text-2)]"
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
}
