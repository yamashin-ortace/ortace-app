import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const ANSWER_HISTORY_DISPLAY_LIMIT = 10_000;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows: unknown[] = [];
  let pageFrom = 0;

  while (rows.length < ANSWER_HISTORY_DISPLAY_LIMIT) {
    const pageTo = Math.min(
      pageFrom + PAGE_SIZE - 1,
      ANSWER_HISTORY_DISPLAY_LIMIT - 1,
    );
    const { data, error } = await supabase
      .from("answer_history")
      .select("*")
      .eq("user_id", user.id)
      .order("answered_at", { ascending: false })
      .range(pageFrom, pageTo);

    if (error) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    pageFrom += PAGE_SIZE;
  }

  return NextResponse.json({ rows });
}
