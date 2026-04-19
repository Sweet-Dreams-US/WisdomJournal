import { NextResponse } from "next/server";
import { getStreakState } from "@/lib/data/get-streak-state";

export async function GET() {
  const state = await getStreakState();
  if (!state) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(state);
}
