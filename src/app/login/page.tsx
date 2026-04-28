"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setPending(false);
      setError(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-[18px] font-bold">ログイン（動作確認用）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[13px] leading-6 text-[var(--text-2)]">
            フェーズ2-2 の Google OAuth 動作確認ページです。
          </p>
          <Button onClick={handleGoogle} disabled={pending} className="w-full">
            {pending ? "リダイレクト中..." : "Google でログイン"}
          </Button>
          {error ? (
            <p className="text-[12px] text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
