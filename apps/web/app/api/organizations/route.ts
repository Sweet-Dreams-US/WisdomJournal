import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const SIZE_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, industry, size_range } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Organization name is required" },
      { status: 400 }
    );
  }

  if (size_range != null && !SIZE_RANGES.includes(size_range)) {
    return NextResponse.json(
      { error: "Invalid size range" },
      { status: 400 }
    );
  }

  // Service role: no INSERT policies exist on organizations/organization_members
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // slug = kebab-case(name), with a random 4-char suffix on collision
  const base = kebabCase(name) || "org";
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${randomSuffix()}`;
  }

  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: name.trim(),
      slug,
      industry: industry?.trim() || null,
      size_range: size_range ?? null,
      created_by: user.id,
    })
    .select("id, slug, name")
    .single();

  if (orgError || !organization) {
    return NextResponse.json(
      { error: orgError?.message ?? "Failed to create organization" },
      { status: 500 }
    );
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ organization }, { status: 201 });
}
