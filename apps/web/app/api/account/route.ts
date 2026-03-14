import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirm } = await request.json();

  if (confirm !== "DELETE MY ACCOUNT") {
    return NextResponse.json(
      {
        error:
          'You must confirm account deletion by sending { confirm: "DELETE MY ACCOUNT" }',
      },
      { status: 400 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Soft-delete: set deleted_at on the profile
  const { error } = await admin
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      full_name: "[Deleted User]",
      bio: null,
      avatar_url: null,
      is_discoverable: false,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }

  // Sign out the user
  await supabase.auth.signOut();

  return NextResponse.json({
    message: "Account has been scheduled for deletion.",
  });
}
