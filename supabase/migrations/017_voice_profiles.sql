-- 017: Voice style profiles (vocabulary, tone, patterns for AI personality)

CREATE TABLE voice_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Linguistic patterns extracted from responses
  vocabulary_level TEXT,          -- e.g. "conversational", "academic", "folksy"
  avg_sentence_length NUMERIC(5,1),
  common_phrases TEXT[],
  tone_descriptors TEXT[],       -- e.g. ["warm", "humorous", "direct"]
  speech_patterns JSONB,         -- filler words, cadence, structure

  -- Config
  personality_prompt TEXT,       -- generated system prompt for AI to mimic voice
  sample_response_ids UUID[],   -- responses used to build the profile

  last_rebuilt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
