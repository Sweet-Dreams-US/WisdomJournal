import { notFound } from "next/navigation";
import { getPersonMentions } from "@/lib/data/get-person-mentions";
import PersonDetailClient from "./PersonDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { name: string };
}

export default async function PersonDetailPage({ params }: Props) {
  const normalizedName = decodeURIComponent(params.name);
  const person = await getPersonMentions(normalizedName);

  if (!person) {
    notFound();
  }

  return <PersonDetailClient person={person} />;
}
