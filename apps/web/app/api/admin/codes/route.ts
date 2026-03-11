import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, max_uses } = await request.json();
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("beta_invite_codes")
    .insert({
      code: code.toUpperCase(),
      max_uses: max_uses || 15,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, is_active } = await request.json();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin
    .from("beta_invite_codes")
    .update({ is_active })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
