import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfilesRow } from "@/lib/supabase/database.types";

export type SessionContext = {
  userId: string;
  email: string | null;
  profile: ProfilesRow | null;
};

/**
 * 現在のセッションとプロフィールをまとめて取得。
 * 未ログインなら null を返す。
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
  };
}

/**
 * オンボーディング完了済みかどうか。
 * nickname/grade/goal がすべて埋まっていれば完了とみなす。
 */
export function isOnboarded(profile: ProfilesRow | null): boolean {
  return Boolean(profile?.nickname && profile?.grade && profile?.goal);
}
