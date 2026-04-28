import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings } from "lucide-react";
import { getSessionContext } from "@/lib/auth/profile";
import { signOutAction } from "@/lib/auth/actions";

export default async function MePage() {
  const session = await getSessionContext();

  // proxy.ts で未ログインは /login にリダイレクトされるので、ここでは存在前提
  const profile = session?.profile;
  const nickname = profile?.nickname ?? "ゲスト";

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
        マイページ
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[18px]">{nickname}</CardTitle>
          <p className="text-[12px] text-[var(--text-2)]">{session?.email}</p>
        </CardHeader>
        <CardContent className="space-y-3 text-[14px] text-[var(--text-2)]">
          <ProfileRow label="学年" value={profile?.grade ?? "未設定"} />
          <Separator />
          <ProfileRow label="目標" value={profile?.goal ?? "未設定"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <Link
            href="/settings"
            className="btn-pressable flex items-center justify-between rounded-[10px] border border-border bg-[var(--bg-card)] px-4 py-3 text-[14px] font-medium text-[var(--text-1)] hover:bg-[var(--bg-muted)]"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" strokeWidth={2} />
              設定（テーマ・表示モード）
            </span>
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="btn-pressable flex w-full items-center justify-between rounded-[10px] border border-border bg-[var(--bg-card)] px-4 py-3 text-left text-[14px] font-medium text-destructive hover:bg-destructive/5"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" strokeWidth={2} />
                ログアウト
              </span>
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--text-3)]">{label}</span>
      <span className="text-[14px] font-medium text-[var(--text-1)]">{value}</span>
    </div>
  );
}
