import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const token = process.env.SENTRY_TEST_TOKEN;
  const requestToken = request.nextUrl.searchParams.get("token");

  if (!token || requestToken !== token) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  throw new Error("Sentry verification error");
}
