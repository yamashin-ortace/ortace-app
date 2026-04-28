"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Grade, Goal } from "@/lib/supabase/database.types";

const GRADES: readonly Grade[] = ["1年", "2年", "3年", "4年", "受験生"];
const GOALS: readonly Goal[] = ["基礎固め", "苦手克服", "本番対策"];

export async function saveOnboardingAction(formData: FormData) {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const grade = String(formData.get("grade") ?? "") as Grade;
  const goal = String(formData.get("goal") ?? "") as Goal;

  if (!nickname || nickname.length > 20) {
    return { ok: false as const, message: "ニックネームは1〜20文字で入力してください。" };
  }
  if (!GRADES.includes(grade)) {
    return { ok: false as const, message: "学年を選択してください。" };
  }
  if (!GOALS.includes(goal)) {
    return { ok: false as const, message: "目標を選択してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname, grade, goal })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
