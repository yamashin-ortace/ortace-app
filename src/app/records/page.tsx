import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordsPage() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        記録
      </h1>
      <p className="text-sm text-[var(--text-3)]">
        ノート・ブックマーク・分野別正答率をここに表示します（実装はフェーズ3）。
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">準備中</CardTitle>
        </CardHeader>
        <CardContent className="text-[14px] text-[var(--text-2)]">
          学習履歴が溜まると、ここに統計が並びます。
        </CardContent>
      </Card>
    </div>
  );
}
