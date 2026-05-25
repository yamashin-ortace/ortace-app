import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTrialAuthProvider,
  getTrialState,
  isTrialEligibleAuthProvider,
  type TrialAuthProvider,
  type TrialState,
} from "@/lib/billing/trial";
import type { ProfilesRow } from "@/lib/supabase/database.types";

export type SessionContext = {
  userId: string;
  email: string | null;
  authProvider: TrialAuthProvider;
  profile: ProfilesRow | null;
  trial: TrialState | null;
};

/**
 * 現在のセッションとプロフィールをまとめて取得。
 * 未ログインなら null を返す。
 *
 * React.cache でメモ化することで、同一リクエスト内（layout・page・複数の Server Component）
 * から複数回呼ばれても Supabase への問い合わせは1回で済む。
 */
export const getSessionContext = cache(
  async (): Promise<SessionContext | null> => {
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

    const authProvider = getTrialAuthProvider(user);

    return {
      userId: user.id,
      email: user.email ?? null,
      authProvider,
      profile: profile ?? null,
      trial: profile
        ? getTrialState(profile, new Date(), isTrialEligibleAuthProvider(authProvider))
        : null,
    };
  },
);

/**
 * オンボーディング完了済みかどうか。
 * nickname/grade/goal がすべて埋まっていれば完了とみなす。
 */
export function isOnboarded(profile: ProfilesRow | null): boolean {
  return Boolean(profile?.nickname && profile?.grade && profile?.goal);
}
