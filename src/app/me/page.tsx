import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function MePage() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        マイページ
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">ゲスト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[14px] text-[var(--text-2)]">
          <p>ログイン機能はフェーズ2で実装予定。</p>
          <Link
            href="/settings"
            className="btn-pressable inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-[var(--bg-card)] px-4 py-2 text-[14px] font-medium text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            設定を開く
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
