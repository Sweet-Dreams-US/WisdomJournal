import { createClient } from "@/lib/supabase/server";
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
 * 1. Embed the query text
 * 2. Search accessible responses via vector similarity
 * 3. Build prompt with source context
 * 4. Call Claude Sonnet via OpenRouter
 * 5. Store the query and return results
 */
export async function processWisdomQuery(
  input: WisdomQueryInput
): Promise<WisdomQueryResult> {
  const supabase = createClient();

  try {
    // 1. Generate embedding for the query
    const queryEmbedding = await generateEmbedding(input.queryText);

    if (queryEmbedding.length !== 1536) {
      return {
        ai_response: "",
        source_count: 0,
        source_response_ids: [],
        sources: [],
        error: "Failed to generate query embedding",
      };
    }

    // 2. Search accessible responses
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    const { data: searchResults } = await supabase.rpc(
      "search_accessible_responses",
      {
        p_querier_id: input.querierId,
        p_target_user_id: input.targetUserId,
        p_query_embedding: embeddingStr,
        p_match_threshold: 0.6,
        p_match_count: 8,
      }
    );

    const sources = (searchResults ?? []).map((r: any) => ({
      id: r.response_id,
      text: r.response_text,
      category_slug: r.category_slug,
    }));

    // 3. Get target user's name for personality mode
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("full_name, bio")
      .eq("id", input.targetUserId)
      .single();

    const targetName =
      targetProfile?.full_name?.split(" ")[0] ?? "this person";

    // 4. Build the prompt
    const systemPrompt =
      input.mode === "personality"
        ? `You are channeling the voice and personality of ${targetName}. Based on their journal entries provided below, respond AS IF you are ${targetName} sharing their wisdom. Use first person ("I"), match their tone and speech patterns visible in their entries. Be warm, genuine, and specific — draw directly from their actual words and experiences. If the entries don't contain relevant information, say so honestly rather than making things up.${targetProfile?.bio ? `\n\nAbout ${targetName}: ${targetProfile.bio}` : ""}`
        : `You are a neutral AI assistant summarizing wisdom from ${targetName}'s journal entries. Provide factual, third-person responses based solely on the entries provided below. Be objective and cite specific entries when relevant. If the entries don't contain relevant information, say so clearly.`;

    const sourceContext =
      sources.length > 0
        ? sources
            .map(
              (s: any, i: number) =>
                `[Entry ${i + 1}] (Category: ${s.category_slug})\n${s.text}`
            )
            .join("\n\n")
        : "No relevant journal entries were found.";

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `Here are ${targetName}'s relevant journal entries:\n\n${sourceContext}\n\n---\n\nQuestion: ${input.queryText}`,
      },
    ];

    // 5. Call Claude via OpenRouter
    const aiResult = await chatCompletion(messages, {
      maxTokens: 512,
      temperature: input.mode === "personality" ? 0.8 : 0.5,
    });

    // 6. Store the query
    const sourceIds = sources.map((s: any) => s.id);
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
