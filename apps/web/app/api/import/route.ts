import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { embedResponse } from "@/lib/ai/embeddings";

interface ImportEntry {
  question?: string;
  response: string;
  date?: string;
  category?: string; // slug
}

/**
 * Convert an entry's date string to an ISO timestamp. Date-only strings
 * (YYYY-MM-DD — the common case for Obsidian daily notes and CSV exports)
 * parse as UTC *midnight*, which files the entry under the previous day in
 * western timezones — anchor them to noon instead. Throws on invalid dates
 * (same as the previous `new Date(...).toISOString()` behavior) so the
 * entry is recorded in the error log.
 */
function parseImportDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00`).toISOString();
  }
  return new Date(trimmed).toISOString();
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entries, source = "json" } = await request.json();

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "entries must be a non-empty array" },
      { status: 400 }
    );
  }

  if (entries.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 entries per import" },
      { status: 400 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all categories for matching
  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug");

  const categoryMap = new Map(
    (categories ?? []).map((c: any) => [c.slug, c.id])
  );

  // Create import record. The wisdom_imports.source CHECK constraint only
  // allows manual|csv|json, so markdown (Obsidian) imports are recorded
  // under "manual".
  const dbSource =
    source === "markdown"
      ? "manual"
      : ["manual", "csv", "json"].includes(source)
        ? source
        : "json";

  const { data: importRecord } = await admin
    .from("wisdom_imports")
    .insert({
      user_id: user.id,
      source: dbSource,
      status: "processing",
      total_entries: entries.length,
    })
    .select()
    .single();

  let imported = 0;
  let failed = 0;
  const errorLog: any[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry: ImportEntry = entries[i];

    if (!entry.response?.trim()) {
      failed++;
      errorLog.push({
        index: i,
        error: "Missing response text",
      });
      continue;
    }

    try {
      const responseText = entry.response.trim();
      const wordCount = responseText.split(/\s+/).filter(Boolean).length;

      // Insert response. The input_method enum only allows text|voice|mixed
      // (verified against the live DB) — imported entries are text.
      const { data: response, error: responseError } = await admin
        .from("responses")
        .insert({
          user_id: user.id,
          response_text: responseText,
          word_count: wordCount,
          input_method: "text",
          response_context: "personal",
          created_at: entry.date
            ? parseImportDate(entry.date)
            : new Date().toISOString(),
        })
        .select()
        .single();

      if (responseError) {
        throw new Error(responseError.message);
      }

      // Auto-assign category if provided. The category_tag_source enum only
      // allows primary|ai_suggested|user_override — the user supplied this
      // mapping (CSV column, JSON field, or Obsidian tag), so user_override.
      if (entry.category && categoryMap.has(entry.category)) {
        await admin.from("response_categories").insert({
          response_id: response.id,
          category_id: categoryMap.get(entry.category),
          source: "user_override",
        });
      } else if (categories && categories.length > 0) {
        // Default to first category if no match
        // Could be improved with AI categorization later
      }

      // Generate embedding asynchronously (fire-and-forget)
      embedResponse(response.id, responseText).catch(console.error);

      imported++;
    } catch (err: any) {
      failed++;
      errorLog.push({
        index: i,
        error: err.message || "Unknown error",
      });
    }
  }

  // Update import record
  if (importRecord) {
    await admin
      .from("wisdom_imports")
      .update({
        status: failed === entries.length ? "failed" : "completed",
        imported_entries: imported,
        failed_entries: failed,
        error_log: errorLog,
        completed_at: new Date().toISOString(),
      })
      .eq("id", importRecord.id);
  }

  return NextResponse.json({
    import_id: importRecord?.id,
    total: entries.length,
    imported,
    failed,
    errors: errorLog.length > 0 ? errorLog.slice(0, 10) : undefined,
  });
}
