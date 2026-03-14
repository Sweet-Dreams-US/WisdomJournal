import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { format } = await request.json();
  if (!format || !["json", "csv"].includes(format)) {
    return NextResponse.json(
      { error: "format must be 'json' or 'csv'" },
      { status: 400 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all user's responses with questions and categories
  const { data: responses } = await admin
    .from("responses")
    .select(
      `
      id, response_text, word_count, input_method, is_favorite, created_at,
      question:questions(question_text),
      categories:response_categories(category:categories(name, slug))
    `
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Format the data
  const exportData = (responses ?? []).map((r: any) => ({
    date: r.created_at,
    question: r.question?.question_text ?? "",
    response: r.response_text,
    word_count: r.word_count,
    categories: (r.categories ?? [])
      .map((c: any) => c.category?.name)
      .filter(Boolean)
      .join(", "),
    is_favorite: r.is_favorite,
  }));

  // Record the export
  await admin.from("data_exports").insert({
    user_id: user.id,
    format,
    status: "completed",
    completed_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "json") {
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wisdom-journal-export-${dateStr}.json"`,
      },
    });
  } else {
    // CSV
    const headers = [
      "date",
      "question",
      "response",
      "word_count",
      "categories",
      "is_favorite",
    ];
    const csvRows = [headers.join(",")];
    for (const row of exportData) {
      csvRows.push(
        headers
          .map((h) => {
            const val = String((row as any)[h] ?? "");
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(",")
      );
    }
    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wisdom-journal-export-${dateStr}.csv"`,
      },
    });
  }
}
