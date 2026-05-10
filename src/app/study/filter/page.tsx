import { BackLink } from "@/components/study/back-link";
import { FilterSettingsClient } from "@/components/study/filter-settings-client";
import { EXAM_ROUNDS, FIELDS, type Field } from "@/lib/questions";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function FilterModePage() {
  const questions = await loadAllQuestions();
  const countsByField = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      questions.filter((question) => question.majorCategory === field).length,
    ]),
  ) as Record<Field, number>;

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <BackLink href="/study" label="学習" />
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          絞り込み演習
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          回・午前午後・分野・問題数を選んで出題します
        </p>
      </div>

      <FilterSettingsClient
        rounds={EXAM_ROUNDS}
        fields={FIELDS}
        countsByField={countsByField}
      />
    </div>
  );
}
