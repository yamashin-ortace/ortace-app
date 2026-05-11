import { BackLink } from "@/components/study/back-link";
import { UnansweredSettingsClient } from "@/components/study/unanswered-settings-client";
import { FIELDS } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function UnansweredSettingsPage() {
  const questions = await loadAllQuestions();

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          未着手から解く
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          まだ解いていない問題から、分野と出題数を選んで取り組みます
        </p>
      </div>

      <UnansweredSettingsClient questions={questions} fields={FIELDS} />
    </div>
  );
}
