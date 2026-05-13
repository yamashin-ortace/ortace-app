import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { BookmarkSetPlayClient } from "@/components/study/bookmark-set-play-client";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { loadAllQuestions } from "@/lib/questions/loader";
import {
  BOOKMARK_STUDY_MODES,
  isBookmarkCategoryId,
} from "@/lib/study-items/study-modes";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function BookmarkCategoryPlayPage({ params }: Props) {
  const { category } = await params;
  if (!isBookmarkCategoryId(category)) notFound();

  const mode = BOOKMARK_STUDY_MODES.find(
    (m) => m.kind === "bookmark" && m.category === category,
  );
  if (!mode || mode.kind !== "bookmark") notFound();

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
          {mode.label}
        </h1>
        <p className="text-[12px] leading-relaxed text-[var(--text-3)]">
          {mode.summary}
        </p>
      </div>
      <BookmarkSetPlayClient
        questions={questions}
        source={{ kind: "bookmark", category: mode.category }}
        resumeLabel={mode.label}
        emptyTitle="該当するブックマークがありません"
        emptyMessage="演習中に「カテゴリ」を選んで保存すると、ここから解き直せます。"
        plan={plan}
      />
    </div>
  );
}
