import { BackLink } from "@/components/study/back-link";
import { BookmarkSetPlayClient } from "@/components/study/bookmark-set-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";
import { getBookmarkStudyMode } from "@/lib/study-items/study-modes";

export default async function NotesPlayPage() {
  const mode = getBookmarkStudyMode("notes");
  const questions = await loadAllQuestions();
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlan({
        plan: session.profile.plan,
        status: session.profile.plan_status,
        expiresAt: session.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <BackLink href="/study" label="学習" />
      <div className="space-y-1">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[var(--text-1)]">
          {mode?.label ?? "ノート付き問題"}
        </h1>
        <p className="text-[12px] leading-relaxed text-[var(--text-3)]">
          {mode?.summary ??
            "ノートを保存した問題だけを順に出題します。"}
        </p>
      </div>
      <BookmarkSetPlayClient
        questions={questions}
        source={{ kind: "notes" }}
        resumeLabel="ノート付き問題"
        emptyTitle="ノート付きの問題がありません"
        emptyMessage="気づきや覚えたい要点を演習中にメモしておくと、ここからまとめて解き直せます。"
        plan={plan}
      />
    </div>
  );
}
