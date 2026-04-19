import { NextRequest, NextResponse } from "next/server";
import { getWeeklyDigest } from "@/lib/data/get-digest";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const digest = await getWeeklyDigest({ weekOffset: offset });
  if (!digest) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ digest });
}
