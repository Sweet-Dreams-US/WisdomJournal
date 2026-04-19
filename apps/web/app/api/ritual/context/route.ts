import { NextResponse } from "next/server";
import { getContextLine } from "@/lib/data/get-context-line";

export async function GET() {
  const line = await getContextLine();
  return NextResponse.json({ line });
}
