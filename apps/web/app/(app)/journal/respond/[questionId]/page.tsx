import { notFound, redirect } from "next/navigation";
import { getDailyQuestions } from "@/lib/data/get-daily-questions";
import RespondClient from "./RespondClient";

interface Props {
  params: { questionId: string };
}

export default async function RespondPage({ params }: Props) {
  const dailySet = await getDailyQuestions();

  if (!dailySet) {
    redirect("/dashboard");
  }

  const items = (dailySet as any)?.items ?? [];
  const item = items.find(
    (i: any) => i.question_id === params.questionId || i.question?.id === params.questionId
  );

  if (!item?.question) {
    notFound();
  }

  const questionIndex = items.indexOf(item);

  return (
    <RespondClient
      question={item.question}
      dailyItemId={item.id}
      setId={dailySet.id}
      categorySlug={item.question.category?.slug}
      categoryName={item.question.category?.name}
      questionIndex={questionIndex >= 0 ? questionIndex : 0}
      totalQuestions={items.length}
    />
  );
}
