import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudyPage() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        学習
      </h1>
      <p className="text-sm text-[var(--text-3)]">
        過去問・ランダム出題・復習モードをここから開きます（実装はフェーズ3）。
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">準備中</CardTitle>
        </CardHeader>
        <CardContent className="text-[14px] text-[var(--text-2)]">
          第47〜55回の過去問（1,350問）を移植予定。
        </CardContent>
      </Card>
    </div>
  );
}
