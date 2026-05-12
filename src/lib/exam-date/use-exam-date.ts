"use client";

import { useEffect, useState } from "react";
import { getDefaultExamDate } from ".";

/**
 * 本試験日は当面「2月の第3木曜日」で固定とする。
 * ユーザーが UI から変更する手段は提供していない（仮固定）。
 * SSR と初回クライアントで同じ既定値を返すため、ハイドレーション差分は起きない。
 */
export function useExamDate() {
  const [examDate, setExamDate] = useState(() => getDefaultExamDate());

  useEffect(() => {
    // 端末の現在時刻に依存して年が変わるため、マウント後にも一度同期する。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 端末時刻に追従する目的
    setExamDate(getDefaultExamDate());
  }, []);

  return {
    examDate,
    /** 仮固定なので常に false。表示上の「（仮）」判定に利用する。 */
    isCustom: false,
  };
}
