-- 016: Billing events (Stripe webhook log)

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type billing_event_type NOT NULL,

  -- Can be individual or group billing
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'usd',

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_user ON billing_events(user_id);
CREATE INDEX idx_billing_events_group ON billing_events(group_id);
CREATE INDEX idx_billing_events_stripe ON billing_events(stripe_event_id);
