import {
  RecordsClient,
  type QuestionSummary,
} from "@/components/records/records-client";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function RecordsPage() {
  const questions = await loadAllQuestions();
  const summaries: QuestionSummary[] = questions.map((q) => ({
    id: q.id,
    round: q.round,
    session: q.session,
    displayNumber: q.displayNumber,
    questionText: q.questionText,
    majorCategory: q.majorCategory,
  }));

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-1)]">
          記録
        </h1>
        <p className="text-[12px] text-[var(--text-3)]">
          保存した問題とノートを見返せます
        </p>
      </div>

      <RecordsClient questions={summaries} />
    </div>
  );
}
