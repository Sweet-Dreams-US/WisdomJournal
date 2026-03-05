import { notFound } from "next/navigation";
import { getResponse } from "@/lib/data/get-response";
import ResponseDetailClient from "./ResponseDetailClient";

interface Props {
  params: { responseId: string };
}

export default async function ResponseDetailPage({ params }: Props) {
  const response = await getResponse(params.responseId);

  if (!response) {
    notFound();
  }

  return <ResponseDetailClient response={response} />;
}
