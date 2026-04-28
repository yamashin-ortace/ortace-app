import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AuthStatus() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="rounded-md border border-border bg-[var(--bg-muted)] px-3 py-2 text-[12px] text-[var(--text-2)]">
      {user ? (
        <span>
          ログイン中: <strong className="text-[var(--text-1)]">{user.email}</strong>
          <Link href="/logout" className="ml-2 underline">
            ログアウト
          </Link>
        </span>
      ) : (
        <span>
          未ログイン
          <Link href="/login" className="ml-2 underline">
            ログインへ
          </Link>
        </span>
      )}
    </div>
  );
}
