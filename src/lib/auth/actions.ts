"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * メール + パスワードでログイン。
 */
export async function signInWithPasswordAction(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: translateAuthError(error.message) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * メール + パスワードで新規登録。
 * 確認メールを送信し、リンク経由で /auth/callback に戻す。
 */
export async function signUpWithPasswordAction(
  email: string,
  password: string,
): Promise<ActionResult> {
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    return { ok: false, message: translateAuthError(error.message) };
  }
  return { ok: true };
}

/**
 * マジックリンクを送信。
 */
export async function sendMagicLinkAction(email: string): Promise<ActionResult> {
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    return { ok: false, message: translateAuthError(error.message) };
  }
  return { ok: true };
}

/**
 * サインアウト。
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // オンボ判定キャッシュ Cookie もクリア
  const cookieStore = await cookies();
  cookieStore.delete("ortace_onboarded");
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Supabase の英語エラーメッセージを日本語に変換。
 */
function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません。",
    "Email not confirmed": "確認メールのリンクをクリックして登録を完了してください。",
    "User already registered": "このメールアドレスはすでに登録されています。",
    "Password should be at least 6 characters":
      "パスワードは6文字以上で入力してください。",
  };
  return map[message] ?? message;
}
