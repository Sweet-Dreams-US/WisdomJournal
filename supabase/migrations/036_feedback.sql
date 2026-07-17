-- 036: Beta feedback
--
-- Lightweight in-app feedback channel for the test-user phase. Users file
-- bugs/ideas from anywhere in the app; admins review them on /admin.
--
-- Note: an earlier hand-created `feedback` table existed in the live DB with
-- no RLS, no code references, and zero rows. This migration recreates it
-- deterministically so the repo is the source of truth.

DROP TABLE IF EXISTS feedback;

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('bug', 'idea', 'praise', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  page_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX idx_feedback_new ON feedback(status) WHERE status = 'new';

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can file feedback as themselves
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can see what they submitted
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage everything
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
