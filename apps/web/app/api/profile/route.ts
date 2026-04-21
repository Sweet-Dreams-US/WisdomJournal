import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    "full_name",
    "username",
    "bio",
    "timezone",
    "ai_personality_enabled",
    "voice_response_enabled",
    "voice_capture_enabled",
    "notification_preferences",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  // Validate username shape before hitting the DB for a cleaner error message
  if (typeof updates.username === "string") {
    const normalized = updates.username.trim().toLowerCase();
    if (normalized === "") {
      updates.username = null;
    } else if (!/^[a-z0-9_]{3,32}$/.test(normalized)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–32 characters, lowercase letters, numbers, or underscores.",
        },
        { status: 400 }
      );
    } else {
      updates.username = normalized;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    // Friendlier error on unique violation for username
    if (error.code === "23505" && "username" in updates) {
      return NextResponse.json(
        { error: "That username is taken. Try another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
