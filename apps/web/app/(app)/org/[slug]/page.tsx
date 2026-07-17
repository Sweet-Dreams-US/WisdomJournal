import { notFound } from "next/navigation";
import { getOrganization } from "@/lib/data/get-organization";
import OrgClient from "./OrgClient";

interface Props {
  params: { slug: string };
}

export default async function OrgPage({ params }: Props) {
  const data = await getOrganization(params.slug);

  if (!data) {
    notFound();
  }

  return <OrgClient data={data} />;
}
