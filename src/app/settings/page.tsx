import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemePicker } from "@/components/theme-picker";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { AttemptBadgeSetting } from "@/components/settings/attempt-badge-setting";
import { ExamDateSetting } from "@/components/settings/exam-date-setting";

export default function SettingsPage() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        設定
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">本試験日</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamDateSetting />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">学習設定</CardTitle>
        </CardHeader>
        <CardContent>
          <AttemptBadgeSetting />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">表示モード</CardTitle>
        </CardHeader>
        <CardContent>
          <DarkModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">カラーテーマ</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>
    </div>
  );
}
