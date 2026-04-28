import { AuthStatus } from "@/components/auth-status";
import { HomeGreeting } from "@/components/home-greeting";
import { HomeStatCard, StreakStatCard } from "@/components/home-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6 pt-2">
      <AuthStatus />
      <HomeGreeting />

      <section>
        <div className="grid grid-cols-3 items-stretch gap-3">
          <StreakStatCard />
          <HomeStatCard
            icon={<BookOpen className="h-5 w-5" strokeWidth={2} />}
            label="今日の解答"
            value="0"
            unit="問"
          />
          <HomeStatCard
            icon={<Target className="h-5 w-5" strokeWidth={2} />}
            label="正答率"
            value="--"
            unit="%"
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-[18px] font-bold">セットアップ中</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-[14px] leading-7 text-[var(--text-2)]">
          <p>フェーズ1：基盤構築の表示確認ページです。</p>
          <p>
            右上の
            <span className="mx-1 rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-[12px]">
              設定
            </span>
            からテーマ5色切替・ダークモードを試せます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
