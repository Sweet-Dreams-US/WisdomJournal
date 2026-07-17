import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      error_message,
      error_stack,
      component_stack,
      page_url,
      severity,
      metadata,
    } = body;

    const admin = getServiceClient();
    const { error } = await admin.from("error_logs").insert({
      user_id: user?.id || null,
      error_message: error_message || "Unknown error",
      error_stack: error_stack || null,
      component_stack: component_stack || null,
      page_url: page_url || null,
      user_agent: req.headers.get("user-agent") || null,
      severity: severity || "error",
      metadata: metadata || {},
    });

    if (error) {
      console.error("Failed to log error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getServiceClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const severity = url.searchParams.get("severity");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    let query = admin
      .from("error_logs")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ errors: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
