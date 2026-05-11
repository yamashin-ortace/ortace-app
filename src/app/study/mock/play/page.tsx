import { BackLink } from "@/components/study/back-link";
import { MockPlayer } from "@/components/study/mock-player";
import { loadAllQuestions } from "@/lib/questions/loader";

export default async function MockPlayPage() {
  const questions = await loadAllQuestions();

  return (
    <div className="space-y-3 pt-2">
      <BackLink href="/study/mock" label="模試の説明へ" />
      <MockPlayer questions={questions} />
    </div>
  );
}
