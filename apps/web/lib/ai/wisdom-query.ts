import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { chatCompletion, generateEmbedding } from "./openrouter";

interface WisdomQueryInput {
  querierId: string;
  targetUserId: string;
  queryText: string;
  groupId: string | null;
  mode: "personality" | "neutral";
}

export interface WisdomQueryResult {
  id?: string;
  ai_response: string;
  source_count: number;
  source_response_ids: string[];
  sources: { id: string; text: string; category_slug: string }[];
  error?: string;
}

/**
 * Process a wisdom query using RAG:
 * 1. Try vector search, fall back to recent responses
 * 2. Build prompt with source context
 * 3. Call Claude Sonnet via OpenRouter
 * 4. Store the query and return results
 */
export async function processWisdomQuery(
  input: WisdomQueryInput
): Promise<WisdomQueryResult> {
  const supabase = createClient();

  try {
    let sources: { id: string; text: string; category_slug: string }[] = [];

    // Try vector search first
    try {
      const queryEmbedding = await generateEmbedding(input.queryText);

      if (queryEmbedding.length === 1536) {
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        // Use service role for RPC to bypass RLS on embeddings
        const admin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: searchResults, error: rpcError } = await admin.rpc(
          "search_accessible_responses",
          {
            p_querier_id: input.querierId,
            p_target_user_id: input.targetUserId,
            p_query_embedding: embeddingStr,
            p_match_threshold: 0.5,
            p_match_count: 8,
          }
        );

        if (rpcError) {
          console.error("Vector search RPC error:", rpcError);
        }

        if (searchResults && searchResults.length > 0) {
          sources = searchResults.map((r: any) => ({
            id: r.response_id,
            text: r.response_text,
            category_slug: r.category_slug ?? "unknown",
          }));
        }
      }
    } catch (embedError) {
      console.error("Embedding/vector search failed, falling back:", embedError);
    }

    // Fallback: if no vector results, fetch recent responses directly
    if (sources.length === 0) {
      const { data: recentResponses } = await supabase
        .from("responses")
        .select(`
          id, response_text,
          categories:response_categories(category:categories(slug))
        `)
        .eq("user_id", input.targetUserId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(8);

      if (recentResponses && recentResponses.length > 0) {
        sources = recentResponses.map((r: any) => ({
          id: r.id,
          text: r.response_text,
          category_slug: r.categories?.[0]?.category?.slug ?? "unknown",
        }));
      }
    }

    // Get target user's name
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("full_name, bio")
      .eq("id", input.targetUserId)
      .maybeSingle();

    const targetName =
      targetProfile?.full_name?.split(" ")[0] ?? "this person";

    // Build the prompt
    const outputRules = `

STRICT OUTPUT RULES:
- NEVER use dashes, hyphens, em dashes, or en dashes in your sentences. No "-", no "—", no "–". Rephrase instead.
- Keep your answer concise and direct. Do not over explain. Do not pad with filler words.
- You must ONLY use information found in the journal entries below. Do NOT use any outside knowledge, general advice, or common wisdom. If the entries do not contain an answer, say you don't have enough entries to answer that.
- Do not list things unless the person listed them. Write naturally.
- No generic AI phrases like "It's important to note" or "I hope this helps" or "Based on the information provided".`;

    const systemPrompt =
      input.mode === "personality"
        ? `You are channeling the voice and personality of ${targetName}. Based on their journal entries provided below, respond AS IF you are ${targetName} sharing their wisdom. Use first person ("I"), match their tone and speech patterns visible in their entries. Be warm, genuine, and specific. Draw directly from their actual words and experiences.${targetProfile?.bio ? `\n\nAbout ${targetName}: ${targetProfile.bio}` : ""}${outputRules}`
        : `You are summarizing wisdom from ${targetName}'s journal entries. Provide responses based solely on the entries provided below. Use third person. If the entries don't contain relevant information, say so plainly.${outputRules}`;

    if (sources.length === 0) {
      return {
        ai_response: "You don't have any journal entries yet. Answer some daily questions first, then come back and ask about your wisdom.",
        source_count: 0,
        source_response_ids: [],
        sources: [],
      };
    }

    const sourceContext = sources
      .map(
        (s, i) =>
          `[Entry ${i + 1}] (Category: ${s.category_slug})\n${s.text}`
      )
      .join("\n\n");

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `Here are ${targetName}'s relevant journal entries:\n\n${sourceContext}\n\n---\n\nQuestion: ${input.queryText}`,
      },
    ];

    // Call Claude via OpenRouter
    const aiResult = await chatCompletion(messages, {
      maxTokens: 300,
      temperature: input.mode === "personality" ? 0.7 : 0.4,
    });

    // Store the query
    const sourceIds = sources.map((s) => s.id);
    const costCents = Math.ceil(
      (aiResult.tokens_input * 0.003 + aiResult.tokens_output * 0.015) / 10
    );

    const { data: queryRecord } = await supabase
      .from("wisdom_queries")
      .insert({
        querier_id: input.querierId,
        target_user_id: input.targetUserId,
        group_id: input.groupId,
        query_text: input.queryText,
        ai_response: aiResult.content,
        ai_model: aiResult.model,
        ai_tokens_input: aiResult.tokens_input,
        ai_tokens_output: aiResult.tokens_output,
        ai_cost_cents: costCents,
        source_response_ids: sourceIds,
        source_count: sourceIds.length,
      })
      .select()
      .single();

    return {
      id: queryRecord?.id,
      ai_response: aiResult.content,
      source_count: sourceIds.length,
      source_response_ids: sourceIds,
      sources,
    };
  } catch (error) {
    console.error("Wisdom query failed:", error);
    return {
      ai_response: "",
      source_count: 0,
      source_response_ids: [],
      sources: [],
      error:
        error instanceof Error ? error.message : "Failed to process query",
    };
  }
}
