import { getOrganizations } from "@/lib/data/get-organizations";
import OrganizationsClient from "./OrganizationsClient";

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return <OrganizationsClient organizations={organizations} />;
}
