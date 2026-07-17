-- 038: Allow embedding writes
--
-- response_embeddings had RLS enabled with ONLY a SELECT policy, so the
-- fire-and-forget upsert after every response save was silently denied —
-- the table stayed empty forever and Ask always used the non-semantic
-- fallback. (The upsert's error was also unchecked in app code; fixed in
-- lib/ai/embeddings.ts, which now also uses the service-role client.)
--
-- These policies make user-scoped writes legal for a user's own
-- responses, so local tooling and any future client-side path work too.

CREATE POLICY "Users can insert embeddings for own responses"
  ON response_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update embeddings for own responses"
  ON response_embeddings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete embeddings for own responses"
  ON response_embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id AND r.user_id = auth.uid()
    )
  );
