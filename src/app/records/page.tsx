import {
  RecordsClient,
  type QuestionSummary,
  type QuestionClusterEntry,
} from "@/components/records/records-client";
import { loadAllQuestions } from "@/lib/questions/loader";
import { getAiThemeCluster } from "@/lib/ai-coach/theme-cluster";

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
  const clusters: QuestionClusterEntry[] = questions.map((q) => {
    const cluster = getAiThemeCluster(q);
    return { id: q.id, clusterId: cluster.id, clusterLabel: cluster.label };
  });

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

      <RecordsClient questions={summaries} clusters={clusters} />
    </div>
  );
}
