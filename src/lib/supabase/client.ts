import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ（Client Component）用 Supabase クライアント。
 * クッキーベースで Supabase Auth のセッションを参照する。
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
