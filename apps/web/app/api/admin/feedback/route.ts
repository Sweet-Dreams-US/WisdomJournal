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

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: feedback, error } = await admin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user info
  const userIds = [...new Set((feedback || []).map((f: any) => f.user_id).filter(Boolean))];
  let userMap: Record<string, { full_name: string | null; email: string }> = {};

  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    (users || []).forEach((u: any) => {
      userMap[u.id] = { full_name: u.full_name, email: u.email };
    });
  }

  const enriched = (feedback || []).map((f: any) => ({
    ...f,
    user_name: userMap[f.user_id]?.full_name || null,
    user_email: userMap[f.user_id]?.email || null,
  }));

  return NextResponse.json({ feedback: enriched });
}

export async function PATCH(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, status, admin_notes } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (typeof admin_notes === "string") updates.admin_notes = admin_notes;

  const { error } = await admin
    .from("feedback")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
