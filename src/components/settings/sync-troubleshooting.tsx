"use client";

import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ANSWER_HISTORY_STORAGE_KEY,
  ANSWER_HISTORY_UPDATED_EVENT,
  parseAnswerHistoryStore,
  serializeAnswerHistoryStore,
} from "@/lib/answer-history";
import {
  DAILY_LIMIT_STORAGE_KEY,
  getTokyoDateString,
  parseDailyLimitRecord,
  serializeDailyLimitRecord,
} from "@/lib/daily-limit";
import {
  syncAnswerHistoryWithDatabase,
  syncDailyLimitWithDatabase,
} from "@/lib/study-sync";

const DAILY_LIMIT_UPDATED_EVENT = "ortace:daily-limit-updated";

export function SyncTroubleshooting() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setMessage(null);
    startTransition(async () => {
      try {
        const answerHistory = parseAnswerHistoryStore(
          window.localStorage.getItem(ANSWER_HISTORY_STORAGE_KEY),
        );
        const mergedHistory =
          await syncAnswerHistoryWithDatabase(answerHistory);

        if (mergedHistory) {
          window.localStorage.setItem(
            ANSWER_HISTORY_STORAGE_KEY,
            serializeAnswerHistoryStore(mergedHistory),
          );
          window.dispatchEvent(new Event(ANSWER_HISTORY_UPDATED_EVENT));
        }

        const dailyLimit = parseDailyLimitRecord(
          window.localStorage.getItem(DAILY_LIMIT_STORAGE_KEY),
          getTokyoDateString(),
        );
        const mergedDailyLimit = await syncDailyLimitWithDatabase(dailyLimit);

        if (mergedDailyLimit) {
          window.localStorage.setItem(
            DAILY_LIMIT_STORAGE_KEY,
            serializeDailyLimitRecord(mergedDailyLimit),
          );
          window.dispatchEvent(new Event(DAILY_LIMIT_UPDATED_EVENT));
        }

        if (!mergedHistory && !mergedDailyLimit) {
          setMessage(
            "同期できませんでした。ログイン状態や通信環境を確認して、もう一度お試しください。",
          );
          return;
        }

        setMessage("最新データを取り込みました。ホームや記録画面を開き直してください。");
      } catch {
        setMessage(
          "同期中にエラーが起きました。通信環境を確認して、もう一度お試しください。",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 text-[13px] leading-relaxed text-[var(--text-2)]">
        <p>
          PCとスマホで学習数が違うときは、SafariやChromeに残っている古いローカルデータやキャッシュが原因のことがあります。
          シークレットモードで正しく見える場合は、アカウント側のデータは保存されている可能性が高いです。
        </p>
        <p>
          まずは下のボタンで、アカウントに保存された最新の学習履歴をこの端末へ取り込みます。
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-center gap-2 text-[13px] font-bold sm:w-auto"
        disabled={isPending}
        onClick={handleSync}
      >
        <RefreshCcw
          className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          strokeWidth={2.5}
        />
        {isPending ? "同期中..." : "最新データを取り込む"}
      </Button>

      {message ? (
        <p className="rounded-[10px] bg-[var(--bg-muted)]/55 px-3 py-2 text-[12px] leading-relaxed text-[var(--text-2)]">
          {message}
        </p>
      ) : null}

      <div className="space-y-1 border-t border-border/70 pt-3 text-[12px] leading-relaxed text-[var(--text-3)]">
        <p className="font-bold text-[var(--text-2)]">それでも直らないとき</p>
        <p>1. ページを再読み込みする</p>
        <p>2. 一度ログアウトして、同じGoogleアカウントでログインし直す</p>
        <p>
          3. SafariのWebサイトデータで <span className="font-semibold">ortace.jp</span>{" "}
          を削除してから開き直す
        </p>
      </div>
    </div>
  );
}
