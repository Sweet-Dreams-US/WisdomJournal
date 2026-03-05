import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./openrouter";

/**
 * Generate and store an embedding for a response.
 * Called after a response is saved. Safe to call multiple times
 * (upserts on response_id + chunk_index).
 */
export async function embedResponse(
  responseId: string,
  responseText: string
): Promise<void> {
  if (!responseText?.trim()) return;

  try {
    const embedding = await generateEmbedding(responseText);

    if (embedding.length !== 1536) {
      console.error(
        `Unexpected embedding dimension: ${embedding.length} (expected 1536)`
      );
      return;
    }

    const supabase = createClient();

    // Convert the number array to the pgvector format string
    const embeddingStr = `[${embedding.join(",")}]`;

    await supabase.from("response_embeddings").upsert(
      {
        response_id: responseId,
        chunk_index: 0,
        content_text: responseText,
        embedding: embeddingStr,
        model: "text-embedding-3-small",
      },
      { onConflict: "response_id,chunk_index" }
    );
  } catch (error) {
    console.error("Failed to embed response:", error);
  }
}
