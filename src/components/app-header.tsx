import Link from "next/link";
import { Settings } from "lucide-react";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { getSessionContext } from "@/lib/auth/profile";

export async function AppHeader() {
  const session = await getSessionContext();
  const nickname = session?.profile?.nickname ?? null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[var(--bg-base)]/90 px-5 backdrop-blur">
      <Link href="/" className="flex items-baseline">
        <span className="text-[20px] font-extrabold tracking-tight text-[var(--primary)]">
          ORT ACE
        </span>
      </Link>
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
