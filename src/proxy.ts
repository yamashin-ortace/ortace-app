import { NextResponse, type NextRequest } from "next/server";
import {
  createAdminBasicAuthChallenge,
  hasValidAdminBasicAuth,
} from "@/lib/admin/basic-auth";
import { hasCompletedOnboarding } from "@/lib/auth/onboarding-profile";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

/** 未ログインでも閲覧可（LP・ログイン・法務ページ・問い合わせ） */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/contact",
  "/opengraph-image",
  "/twitter-image",
  "/legal/privacy",
  "/legal/terms",
  "/legal/tokushoho",
]);
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

  if (
    pathname.startsWith("/admin") &&
    !hasValidAdminBasicAuth(request.headers.get("authorization"))
  ) {
    return createAdminBasicAuthChallenge();
  }

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
  // 同じ利用者のオンボ済み Cookie があれば DB 問い合わせをスキップ（毎ページの遅延削減）。
  // 別アカウントの Cookie は使わず、新規利用者の初回設定を確実に表示する。
  if (user && pathname !== "/onboarding") {
    const onboardedCookie = request.cookies.get(ONBOARDED_COOKIE)?.value;

    if (onboardedCookie !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname,grade,goal,exam_timing")
        .eq("id", user.id)
        .maybeSingle();

      const onboarded = hasCompletedOnboarding(profile);
      if (!onboarded) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        url.search = "";
        return NextResponse.redirect(url);
      }
      // オンボ済み → 次回以降の DB 問い合わせを省略するため Cookie に記録
      response.cookies.set(ONBOARDED_COOKIE, user.id, ONBOARDED_COOKIE_OPTIONS);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Next.js 内部・静的アセット・PWA manifest・metadata 画像などを除外。
     * /api ルートは現状なしだが将来のため除外。
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|opengraph-image|twitter-image|robots.txt|sitemap.xml|api/|landing/).*)",
  ],
};
