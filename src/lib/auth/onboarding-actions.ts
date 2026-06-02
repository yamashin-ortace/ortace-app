"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSelectableExamTiming } from "@/lib/auth/onboarding-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveOnboardingAction(formData: FormData) {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const examTiming = String(formData.get("examTiming") ?? "");
  const destination = String(formData.get("destination") ?? "");

  if (!nickname || nickname.length > 20) {
    return { ok: false as const, message: "ニックネームは1〜20文字で入力してください。" };
  }
  if (!isSelectableExamTiming(examTiming)) {
    return { ok: false as const, message: "受験予定を選択してください。" };
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
    .update({ nickname, exam_timing: examTiming })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect(destination === "home" ? "/" : "/onboarding/diagnostic/play");
}
