import { getResponses } from "@/lib/data/get-responses";
import TimelineClient from "./TimelineClient";

export default async function TimelinePage() {
  const responses = await getResponses();
  return <TimelineClient responses={responses} />;
}
