import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./openrouter";

/**
 * Generate and store an embedding for a response.
 * Called after a response is saved. Safe to call multiple times
 * (upserts on response_id + chunk_index).
 *
 * Uses the service-role client: embeddings are server-derived data, and
 * relying on the user session here once left the table silently empty
 * (RLS denied the writes and the upsert error went unchecked).
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

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Convert the number array to the pgvector format string
    const embeddingStr = `[${embedding.join(",")}]`;

    const { error } = await supabase.from("response_embeddings").upsert(
      {
        response_id: responseId,
        chunk_index: 0,
        content_text: responseText,
        embedding: embeddingStr,
        model: "text-embedding-3-small",
      },
      { onConflict: "response_id,chunk_index" }
    );

    if (error) {
      console.error(`Failed to store embedding for ${responseId}:`, error);
    }
  } catch (error) {
    console.error("Failed to embed response:", error);
  }
}
