-- 001: Enable required PostgreSQL extensions
-- pgvector: Semantic similarity search for response embeddings
-- pg_trgm: Trigram-based fuzzy text search
-- uuid-ossp: UUID generation (used by Supabase auth, available for manual use)

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
