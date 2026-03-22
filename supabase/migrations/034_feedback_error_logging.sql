-- 034: Feedback & error logging system for beta launch

-- Feedback submissions from users
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'crash')),
  title TEXT NOT NULL,
  description TEXT,
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client-side error logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'fatal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API request logs for usage tracking
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_feedback_user ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_type ON public.feedback(type);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX idx_error_logs_user ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_api_logs_user ON public.api_request_logs(user_id);
CREATE INDEX idx_api_logs_path ON public.api_request_logs(path);
CREATE INDEX idx_api_logs_created ON public.api_request_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can do everything with feedback
CREATE POLICY "Admins full access feedback" ON public.feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can insert error logs
CREATE POLICY "Users can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all error logs
CREATE POLICY "Admins view error logs" ON public.error_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can insert their own API logs
CREATE POLICY "Users can insert api logs" ON public.api_request_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all API logs
CREATE POLICY "Admins view api logs" ON public.api_request_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role bypass for server-side logging
CREATE POLICY "Service role full access feedback" ON public.feedback
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access error_logs" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access api_logs" ON public.api_request_logs
  FOR ALL USING (auth.role() = 'service_role');
