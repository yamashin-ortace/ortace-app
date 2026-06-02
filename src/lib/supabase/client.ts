import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export const STUDY_SYNC_CLIENT_VERSION = "3";

/**
 * ブラウザ（Client Component）用 Supabase クライアント。
 * クッキーベースで Supabase Auth のセッションを参照する。
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          "X-Ortace-Study-Sync-Version": STUDY_SYNC_CLIENT_VERSION,
        },
      },
    },
  );
}
