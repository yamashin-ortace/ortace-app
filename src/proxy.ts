import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set(["/login"]);
const AUTH_ROUTES = ["/auth/", "/logout"];
const ONBOARDED_COOKIE = "ortace_onboarded";
const ONBOARDED_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1年
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // セッションを最新化（refresh）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /auth/* と /logout はそのまま素通し（コールバック処理を妨げない）
  if (AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // 未ログインで保護ページ → /login へ
  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ログイン済みで /login → トップへ（多重ログイン防止）
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ログイン済み・/onboarding 以外で profiles 完了状態を確認。
  // オンボ済み Cookie があれば DB 問い合わせをスキップ（毎ページの遅延削減）。
  if (user && pathname !== "/onboarding") {
    const onboardedCookie = request.cookies.get(ONBOARDED_COOKIE);

    if (!onboardedCookie) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname,grade,goal")
        .eq("id", user.id)
        .maybeSingle();

      const onboarded = Boolean(
        profile?.nickname && profile?.grade && profile?.goal,
      );
      if (!onboarded) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        url.search = "";
        return NextResponse.redirect(url);
      }
      // オンボ済み → 次回以降の DB 問い合わせを省略するため Cookie に記録
      response.cookies.set(ONBOARDED_COOKIE, "1", ONBOARDED_COOKIE_OPTIONS);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Next.js 内部・静的アセット・PWA manifest などを除外。
     * /api ルートは現状なしだが将来のため除外。
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|robots.txt|sitemap.xml|api/).*)",
  ],
};
