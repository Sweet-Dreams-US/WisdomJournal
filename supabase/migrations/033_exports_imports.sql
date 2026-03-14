-- 033: Data exports and wisdom imports

CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('json', 'csv')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_exports_user ON data_exports(user_id, created_at DESC);

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own exports" ON data_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create exports" ON data_exports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE wisdom_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'json')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_entries INTEGER DEFAULT 0,
  imported_entries INTEGER DEFAULT 0,
  failed_entries INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_wisdom_imports_user ON wisdom_imports(user_id, created_at DESC);

ALTER TABLE wisdom_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own imports" ON wisdom_imports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create imports" ON wisdom_imports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own imports" ON wisdom_imports FOR UPDATE USING (auth.uid() = user_id);
