import { NextRequest, NextResponse } from "next/server";
import { getActivityFeed } from "@/lib/data/get-activity-feed";

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "30");
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");

  const events = await getActivityFeed(limit, offset);
  return NextResponse.json({ events });
}
