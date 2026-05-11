import { notFound } from "next/navigation";
import { BackLink } from "@/components/study/back-link";
import { FieldStudyClient } from "@/components/study/field-study-client";
import { QuestionCountSelector } from "@/components/study/question-count-selector";
import { getEffectivePlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";
import { FIELDS, type Field } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";

type Props = {
  params: Promise<{ name: string }>;
};

const FIELD_SET = new Set<string>(FIELDS);

export default async function FieldStudyPage({ params }: Props) {
  const { name: rawName } = await params;
  const fieldName = decodeURIComponent(rawName);
  if (!FIELD_SET.has(fieldName)) notFound();

  const questions = await loadAllQuestions();
  const fieldQuestions = questions.filter(
    (q) => q.majorCategory === (fieldName as Field),
  );
  if (fieldQuestions.length === 0) notFound();

  const sessionContext = await getSessionContext();
  const plan = sessionContext?.profile
    ? getEffectivePlan({
        plan: sessionContext.profile.plan,
        status: sessionContext.profile.plan_status,
        expiresAt: sessionContext.profile.plan_expires_at,
      })
    : "free";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/" label="ホーム" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          {fieldName}
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          未着手の問題を優先して出題します
        </p>
      </div>

      <QuestionCountSelector defaultCount={20} />

      <FieldStudyClient
        fieldQuestions={fieldQuestions}
        fieldName={fieldName}
        limit={20}
        plan={plan}
      />
    </div>
  );
}
