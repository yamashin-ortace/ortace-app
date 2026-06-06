import Link from "next/link";
import { Settings } from "lucide-react";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { HeaderDailyLimitBadge } from "@/components/header-daily-limit-badge";
import { OrtAceLogo } from "@/components/brand/ort-ace-logo";
import { getSessionContext } from "@/lib/auth/profile";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";

export async function AppHeader() {
  const session = await getSessionContext();
  const nickname = session?.profile?.nickname ?? null;
  const plan = session?.profile
    ? getEffectivePlanForProfile(session.profile)
    : "free";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[var(--bg-base)]/90 px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/" aria-label="ORT ACE トップへ" className="flex items-center">
          <OrtAceLogo size="sm" />
        </Link>
        <HeaderDailyLimitBadge plan={plan} />
      </div>
      <div className="flex items-center gap-1">
        {nickname ? <HeaderUserMenu nickname={nickname} /> : null}
        <Link
          href="/settings"
          aria-label="設定"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          <Settings className="h-[22px] w-[22px]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
