-- 006: Question bank

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  difficulty question_difficulty NOT NULL DEFAULT 'medium',
  emotional_weight emotional_weight NOT NULL DEFAULT 'neutral',
  expected_length expected_response_length NOT NULL DEFAULT 'medium',

  -- Quality metrics (updated via feedback + admin)
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_answered INTEGER NOT NULL DEFAULT 0,
  times_skipped INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2),          -- 1.00–5.00
  skip_rate NUMERIC(5,4) DEFAULT 0, -- 0.0000–1.0000

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_subcategory ON questions(subcategory_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
