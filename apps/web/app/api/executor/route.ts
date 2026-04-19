import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("legacy_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const {
    contact_name,
    contact_email,
    relationship,
    can_manage_access,
    can_download_archive,
    can_delete_account,
  } = await req.json();

  if (!contact_name?.trim() || !contact_email?.trim()) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("legacy_contacts")
    .insert({
      user_id: user.id,
      contact_name: contact_name.trim(),
      contact_email: contact_email.trim().toLowerCase(),
      relationship: relationship?.trim() || null,
      can_manage_access: Boolean(can_manage_access),
      can_download_archive: Boolean(can_download_archive),
      can_delete_account: Boolean(can_delete_account),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("legacy_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
