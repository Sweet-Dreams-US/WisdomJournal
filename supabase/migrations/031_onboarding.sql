-- Onboarding progress tracking
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  welcome_seen BOOLEAN NOT NULL DEFAULT false,
  categories_selected BOOLEAN NOT NULL DEFAULT false,
  selected_category_ids UUID[] DEFAULT '{}',
  reminder_set BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME,
  first_question_answered BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own onboarding" ON onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own onboarding" ON onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own onboarding" ON onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
