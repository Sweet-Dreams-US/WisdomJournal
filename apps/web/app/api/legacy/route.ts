import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: contacts } = await supabase
    .from("legacy_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });

  return NextResponse.json({ contacts: contacts || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contact_name, contact_email, relationship, message, is_primary } = await request.json();

  if (!contact_name || !contact_email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check if contact has an account
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", contact_email)
    .maybeSingle();

  // If marking as primary, unset existing primary
  if (is_primary) {
    await supabase
      .from("legacy_contacts")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  }

  const { data: contact, error } = await supabase
    .from("legacy_contacts")
    .insert({
      user_id: user.id,
      contact_name,
      contact_email,
      relationship: relationship || null,
      message: message || null,
      is_primary: is_primary || false,
      contact_user_id: existingUser?.id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact }, { status: 201 });
}
