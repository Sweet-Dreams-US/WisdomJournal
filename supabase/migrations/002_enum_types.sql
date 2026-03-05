-- 002: Custom enum types used across the schema

CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium', 'enterprise');
CREATE TYPE group_type AS ENUM ('private', 'organization', 'public');
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE group_member_status AS ENUM ('invited', 'active', 'suspended', 'departed');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'deep', 'challenging');
CREATE TYPE emotional_weight AS ENUM ('light', 'neutral', 'reflective', 'heavy');
CREATE TYPE expected_response_length AS ENUM ('brief', 'medium', 'detailed');
CREATE TYPE input_method AS ENUM ('text', 'voice', 'mixed');
CREATE TYPE response_context AS ENUM ('personal', 'organization');
CREATE TYPE ai_sentiment AS ENUM ('positive', 'neutral', 'reflective', 'negative', 'mixed');
CREATE TYPE trust_color AS ENUM ('green', 'yellow', 'red');
CREATE TYPE achievement_type AS ENUM ('streak', 'category', 'milestone', 'special');
CREATE TYPE daily_set_status AS ENUM ('pending', 'partial', 'completed', 'skipped');
CREATE TYPE notification_type AS ENUM ('daily_reminder', 'streak_warning', 'group_invite', 'query_received', 'achievement', 'system');
CREATE TYPE category_tag_source AS ENUM ('primary', 'ai_suggested', 'user_override');
CREATE TYPE billing_event_type AS ENUM ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'refund');
