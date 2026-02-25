# WISDOM JOURNAL — Complete Technical Specification & Business Plan

**Version:** 1.0  
**Date:** February 25, 2026  
**Document Type:** Technical Specification, Database Schema, API Architecture, Business Plan, Growth Strategy

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Use Cases](#2-product-vision--use-cases)
3. [Technical Architecture Overview](#3-technical-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [API Structure](#5-api-structure)
6. [Question Engine](#6-question-engine)
7. [AI Retrieval & Synthesis Engine](#7-ai-retrieval--synthesis-engine)
8. [Mobile App Architecture](#8-mobile-app-architecture)
9. [Push Notification System](#9-push-notification-system)
10. [Voice Capture & Processing](#10-voice-capture--processing)
11. [UI/UX Design System](#11-uiux-design-system)
12. [Security & Privacy Architecture](#12-security--privacy-architecture)
13. [Business Model & Monetization](#13-business-model--monetization)
14. [Growth Strategy](#14-growth-strategy)
15. [Development Roadmap](#15-development-roadmap)
16. [File & Folder Structure](#16-file--folder-structure)

---

## 1. EXECUTIVE SUMMARY

Wisdom Journal is a mobile-first application that captures human knowledge, experience, and decision-making patterns through daily guided questioning. Over time, it builds a rich, queryable knowledge base that preserves how a person thinks, decides, and communicates — not just what they know.

**Two primary markets:**

**Personal Use:** Individuals answer daily questions to build a living archive of their wisdom, stories, values, and perspectives. If they pass away or become unavailable, loved ones can query this archive to understand how that person would have responded to new questions. Users control whether AI responds in their voice/style or in a neutral tone.

**Business Use:** Key employees (executives, senior engineers, domain experts) capture institutional knowledge through role-specific daily questions. When they leave, their successor inherits a queryable knowledge base of decisions made, reasoning applied, relationships managed, and processes followed. This dramatically reduces the cost and time of knowledge transfer during transitions.

**Core Principle:** Raw responses are sacred. Every word, every tangent, every "weird answer" is stored exactly as the person said it. The AI interpretation layer only exists at query time — never at capture time.

---

## 2. PRODUCT VISION & USE CASES

### 2.1 Personal Use Cases

**Legacy Preservation**
- Grandparent records life stories, values, and advice over months/years
- After passing, grandchildren can ask "What would grandpa think about me changing careers?"
- System synthesizes from relevant responses, citing specific journal entries

**Living Memory Book**
- Parent captures parenting philosophy, family recipes, holiday traditions
- Children access it as a reference throughout their lives
- Voice mode optional: hear responses in the cadence of the person's speech patterns

**Personal Reflection**
- User builds self-awareness through daily reflection
- Can query their own journal: "What patterns do I notice in how I handle conflict?"
- Tracks personal growth over time

### 2.2 Business Use Cases

**Executive Knowledge Transfer**
- CFO documents decision rationale, vendor relationships, budget philosophy
- New CFO queries: "Why did we choose this banking partner?" or "How do we typically handle Q4 budget requests?"
- Reduces 6-month ramp-up to weeks

**Technical Knowledge Base**
- Senior engineer captures system architecture decisions, debugging approaches, tribal knowledge
- New team members query: "Why is the payment system designed this way?" or "What's the history behind the legacy migration?"

**Sales & Client Relationships**
- Account managers document client preferences, deal history, relationship nuances
- Successor inherits: "How does the Johnson account prefer to be communicated with?" or "What were the sticking points in the last renewal?"

**Onboarding Acceleration**
- Multiple departing employees contribute to a role-specific knowledge base
- New hire has access to years of accumulated institutional knowledge from day one

### 2.3 Key Differentiators

1. **Daily habit-driven capture** — not a brain dump, but a slow accumulation of depth
2. **Verbatim preservation** — AI never rewrites or summarizes during capture
3. **Contextual retrieval** — semantic search across all entries to answer novel questions
4. **Voice personality toggle** — personal users choose whether AI "sounds like" the person
5. **Role-based business frameworks** — questions tailored to job functions
6. **Family-friendly, warm, cloud-like aesthetic** — feels safe, soft, inviting

---

## 3. TECHNICAL ARCHITECTURE OVERVIEW

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ React    │  │ React    │  │ React Native      │  │
│  │ Web App  │  │ Admin    │  │ Mobile App        │  │
│  │ (Testing)│  │ Dashboard│  │ (iOS + Android)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
└───────┼──────────────┼─────────────────┼──────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                   API GATEWAY                        │
│              (Express.js / Fastify)                   │
│         Rate Limiting, Auth, Validation              │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌─────────────────┐
│   Core API   │ │  Question   │ │   AI Retrieval  │
│   Service    │ │  Engine     │ │   Service       │
│              │ │  Service    │ │                 │
│ - Users      │ │             │ │ - Embedding     │
│ - Responses  │ │ - Selection │ │ - Vector Search │
│ - Orgs       │ │ - Generation│ │ - Synthesis     │
│ - Permissions│ │ - Scheduling│ │ - Voice Style   │
└──────┬───────┘ └──────┬──────┘ └────────┬────────┘
       │                │                  │
       ▼                ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                   DATA LAYER                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ PostgreSQL │  │ pgvector   │  │ Supabase     │  │
│  │ (Supabase  │  │ (Vector    │  │ Storage      │  │
│  │  Hosted)   │  │  Embeddings│  │ (Audio Files)│  │
│  └────────────┘  └────────────┘  └───────────────┘  │
│  ┌────────────┐  ┌────────────┐                      │
│  │ Redis      │  │ Job Queue  │                      │
│  │ (Cache +   │  │ (BullMQ)   │                      │
│  │  Sessions) │  │            │                      │
│  └────────────┘  └────────────┘                      │
└─────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Mobile App | React Native + Expo | Cross-platform, shared ecosystem with web |
| Web App | React + Next.js | SSR for landing pages, shared components |
| API | Node.js + Fastify | High performance, TypeScript throughout |
| Database | Supabase (PostgreSQL 16) | Managed Postgres, built-in auth, storage, realtime |
| Vector DB | pgvector (Supabase extension) | No separate infra, semantic search |
| Cache | Redis | Session management, rate limiting, question scheduling |
| Job Queue | BullMQ (Redis-backed) | Background processing (embeddings, notifications) |
| Object Storage | Supabase Storage | Audio files, profile images |
| AI/LLM | Anthropic Claude API | Response synthesis, question generation |
| Embeddings | OpenAI text-embedding-3-large | Vector embeddings for semantic search |
| Push Notifications | Expo Notifications | Cross-platform push notifications |
| Audio Processing | Whisper API / Deepgram | Speech-to-text transcription |
| Auth | Supabase Auth | Email, Google, Apple sign-in |
| Payments | Stripe | Subscription billing |
| Monitoring | Sentry + Datadog | Error tracking, performance |
| CI/CD | GitHub Actions + Vercel | Automated testing, deployment |
| Hosting | Vercel | Serverless API + web hosting |

---

## 4. DATABASE SCHEMA

### 4.1 Core Tables

```sql
-- =============================================================
-- USERS & AUTHENTICATION
-- =============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Account Type
    account_type VARCHAR(20) NOT NULL DEFAULT 'personal', -- 'personal' | 'business'
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free' | 'standard' | 'premium' | 'enterprise'
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due' | 'trialing'
    stripe_customer_id VARCHAR(100),
    subscription_expires_at TIMESTAMPTZ,
    
    -- Preferences
    daily_question_count INTEGER DEFAULT 5 CHECK (daily_question_count BETWEEN 1 AND 10),
    preferred_notification_time TIME DEFAULT '09:00:00',
    notification_enabled BOOLEAN DEFAULT TRUE,
    voice_response_enabled BOOLEAN DEFAULT TRUE, -- Allow AI to mimic their voice/style
    voice_capture_enabled BOOLEAN DEFAULT TRUE, -- Allow answering via voice
    ai_personality_enabled BOOLEAN DEFAULT TRUE, -- If false, AI responds neutrally when queried
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deceased BOOLEAN DEFAULT FALSE, -- Marked by family/admin when person passes
    deceased_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- =============================================================
-- ORGANIZATIONS (Business accounts)
-- =============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    industry VARCHAR(100),
    size_range VARCHAR(50), -- '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
    logo_url TEXT,
    
    -- Billing
    subscription_tier VARCHAR(20) DEFAULT 'business', -- 'business' | 'enterprise'
    stripe_customer_id VARCHAR(100),
    subscription_status VARCHAR(20) DEFAULT 'active',
    max_seats INTEGER DEFAULT 10,
    
    -- Settings
    default_question_framework VARCHAR(50) DEFAULT 'general_business',
    data_retention_days INTEGER DEFAULT 365 * 5, -- 5 years default
    allow_personal_questions BOOLEAN DEFAULT TRUE, -- Mix in some personal Qs
    require_daily_responses BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_orgs_slug ON organizations(slug);

-- =============================================================
-- ORGANIZATION MEMBERSHIPS
-- =============================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Role within organization
    role VARCHAR(30) NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
    job_title VARCHAR(200), -- Their actual job title (e.g., 'CFO', 'Senior Engineer')
    department VARCHAR(100), -- 'Finance', 'Engineering', 'Sales', etc.
    
    -- Question Framework Assignment
    question_framework_id UUID, -- Links to specific question set for their role
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'inactive' | 'departed'
    departed_at TIMESTAMPTZ, -- When they left the organization
    departure_reason VARCHAR(50), -- 'resigned' | 'terminated' | 'retired' | 'transferred'
    
    -- Knowledge Transfer
    successor_user_id UUID REFERENCES users(id), -- Who inherits their knowledge
    knowledge_transfer_complete BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(status);

-- =============================================================
-- QUESTION CATEGORIES & FRAMEWORKS
-- =============================================================

CREATE TABLE question_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Values & Beliefs', 'Career Decisions', 'Family Stories', etc.
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- Icon identifier for the app
    color_hex VARCHAR(7), -- Category color
    context_type VARCHAR(20) NOT NULL, -- 'personal' | 'business' | 'both'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frameworks are curated sets of question categories for specific roles/contexts
CREATE TABLE question_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL, -- 'CFO Framework', 'Senior Engineer Framework', 'Personal Legacy'
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    context_type VARCHAR(20) NOT NULL, -- 'personal' | 'business'
    target_role VARCHAR(100), -- 'CFO', 'CTO', 'Sales Manager', NULL for personal
    industry VARCHAR(100), -- Optional industry specialization
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maps categories to frameworks with weighting
CREATE TABLE framework_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES question_frameworks(id),
    category_id UUID NOT NULL REFERENCES question_categories(id),
    weight DECIMAL(3,2) DEFAULT 1.00, -- How heavily to sample from this category
    min_questions_per_month INTEGER DEFAULT 2, -- Ensure minimum coverage
    UNIQUE(framework_id, category_id)
);

-- =============================================================
-- QUESTIONS (The Core Question Bank)
-- =============================================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Question Content
    question_text TEXT NOT NULL,
    question_text_short VARCHAR(200), -- For notifications / previews
    follow_up_prompt TEXT, -- Optional: "Tell me more about..." prompt
    
    -- Classification
    category_id UUID NOT NULL REFERENCES question_categories(id),
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy' | 'medium' | 'deep' | 'challenging'
    emotional_weight VARCHAR(20) DEFAULT 'neutral', -- 'light' | 'neutral' | 'reflective' | 'heavy'
    expected_response_length VARCHAR(20) DEFAULT 'medium', -- 'brief' | 'medium' | 'detailed'
    
    -- Context
    context_type VARCHAR(20) NOT NULL, -- 'personal' | 'business' | 'both'
    target_roles TEXT[], -- Array: ['CFO', 'CEO'] or NULL for any
    
    -- Generation
    is_seed BOOLEAN DEFAULT TRUE, -- TRUE = human-written, FALSE = AI-generated
    generated_from_response_id UUID, -- If AI-generated, which response inspired it
    ai_generation_prompt TEXT, -- The prompt used to generate this question
    
    -- Quality Control
    times_asked INTEGER DEFAULT 0,
    average_response_length INTEGER DEFAULT 0, -- Avg word count of responses
    skip_rate DECIMAL(3,2) DEFAULT 0.00, -- How often users skip this question
    quality_score DECIMAL(3,2) DEFAULT 1.00, -- Composite quality metric
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    requires_review BOOLEAN DEFAULT FALSE, -- For AI-generated questions
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_context ON questions(context_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_questions_quality ON questions(quality_score DESC);

-- =============================================================
-- DAILY QUESTION ASSIGNMENTS
-- =============================================================

CREATE TABLE daily_question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- The day this set is for
    assigned_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'partial' | 'complete' | 'expired'
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ, -- When user first opened today's questions
    completed_at TIMESTAMPTZ,
    
    -- Stats
    questions_count INTEGER DEFAULT 5,
    questions_answered INTEGER DEFAULT 0,
    total_response_time_seconds INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, assigned_date)
);

CREATE INDEX idx_daily_sets_user_date ON daily_question_sets(user_id, assigned_date);
CREATE INDEX idx_daily_sets_status ON daily_question_sets(status);

-- Individual questions within a daily set
CREATE TABLE daily_question_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_set_id UUID NOT NULL REFERENCES daily_question_sets(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    
    -- Order and status
    position INTEGER NOT NULL, -- 1, 2, 3, 4, 5
    status VARCHAR(20) DEFAULT 'unanswered', -- 'unanswered' | 'answered' | 'skipped'
    
    -- Why this question was selected
    selection_reason VARCHAR(50), -- 'category_rotation' | 'follow_up' | 'gap_fill' | 'ai_suggested' | 'random'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(daily_set_id, position)
);

CREATE INDEX idx_daily_items_set ON daily_question_items(daily_set_id);

-- =============================================================
-- RESPONSES (The Sacred Raw Data)
-- =============================================================

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    daily_item_id UUID REFERENCES daily_question_items(id), -- NULL if spontaneous
    
    -- The Sacred Raw Response
    response_text TEXT NOT NULL, -- EXACTLY as the user typed/said it. NEVER modified.
    response_text_length INTEGER GENERATED ALWAYS AS (LENGTH(response_text)) STORED,
    word_count INTEGER, -- Computed on insert
    
    -- Input Method
    input_method VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text' | 'voice' | 'mixed'
    
    -- Voice Data (if applicable)
    audio_file_url TEXT, -- Supabase Storage URL to original audio
    audio_duration_seconds INTEGER,
    audio_transcription_raw TEXT, -- Raw Whisper/Deepgram transcription
    audio_transcription_confidence DECIMAL(3,2), -- Transcription confidence score
    transcription_service VARCHAR(50), -- 'whisper' | 'deepgram'
    
    -- Context
    organization_id UUID REFERENCES organizations(id), -- NULL for personal responses
    response_context VARCHAR(20) DEFAULT 'personal', -- 'personal' | 'business'
    
    -- Time Tracking
    started_at TIMESTAMPTZ, -- When user began responding
    completed_at TIMESTAMPTZ, -- When user submitted
    response_time_seconds INTEGER, -- How long they spent
    
    -- AI Processing (computed AFTER save, never modifies raw text)
    embedding_generated BOOLEAN DEFAULT FALSE,
    embedding_generated_at TIMESTAMPTZ,
    ai_topics TEXT[], -- AI-extracted topics: ['career change', 'risk assessment', 'family values']
    ai_sentiment VARCHAR(20), -- 'positive' | 'negative' | 'neutral' | 'mixed'
    ai_key_themes TEXT[], -- Broader themes extracted
    ai_summary TEXT, -- AI-generated summary (for internal search optimization only)
    
    -- Metadata
    app_version VARCHAR(20),
    platform VARCHAR(20), -- 'ios' | 'android' | 'web'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_user_date ON responses(user_id, created_at);
CREATE INDEX idx_responses_context ON responses(response_context);
CREATE INDEX idx_responses_org ON responses(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_responses_topics ON responses USING GIN(ai_topics);
CREATE INDEX idx_responses_themes ON responses USING GIN(ai_key_themes);

-- =============================================================
-- RESPONSE EMBEDDINGS (Vector Search)
-- =============================================================

-- Requires: CREATE EXTENSION vector;
CREATE TABLE response_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- The embedding vector (3072 dimensions for text-embedding-3-large)
    embedding vector(3072) NOT NULL,
    
    -- Embedding metadata
    model_name VARCHAR(100) DEFAULT 'text-embedding-3-large',
    model_version VARCHAR(50),
    
    -- Chunk info (long responses get split into chunks)
    chunk_index INTEGER DEFAULT 0, -- 0 for single-chunk, 0+ for multi-chunk
    chunk_text TEXT NOT NULL, -- The text this embedding represents
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(response_id, chunk_index)
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_embeddings_vector ON response_embeddings 
    USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 200);

CREATE INDEX idx_embeddings_user ON response_embeddings(user_id);

-- =============================================================
-- QUERIES (When someone asks a question of the knowledge base)
-- =============================================================

CREATE TABLE wisdom_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who is asking
    querier_user_id UUID NOT NULL REFERENCES users(id), -- The person asking
    
    -- Whose wisdom they're querying
    target_user_id UUID NOT NULL REFERENCES users(id), -- The person whose journal is being queried
    
    -- The query
    query_text TEXT NOT NULL,
    query_context VARCHAR(20) DEFAULT 'personal', -- 'personal' | 'business'
    organization_id UUID REFERENCES organizations(id), -- If business context
    
    -- AI Response
    ai_response_text TEXT, -- The synthesized answer
    ai_response_style VARCHAR(20) DEFAULT 'neutral', -- 'personality' | 'neutral'
    ai_model_used VARCHAR(100),
    ai_confidence_score DECIMAL(3,2), -- How confident AI is in the response
    
    -- Sources used
    source_response_ids UUID[], -- Which responses were used to generate the answer
    
    -- Feedback
    querier_rating INTEGER CHECK (querier_rating BETWEEN 1 AND 5),
    querier_feedback TEXT,
    
    -- Metadata
    response_time_ms INTEGER, -- How long the AI took to respond
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_queries_querier ON wisdom_queries(querier_user_id);
CREATE INDEX idx_queries_target ON wisdom_queries(target_user_id);
CREATE INDEX idx_queries_created ON wisdom_queries(created_at);

-- =============================================================
-- ACCESS PERMISSIONS (Who can query whose wisdom)
-- =============================================================

CREATE TABLE access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The journal owner granting access
    grantor_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Who gets access (one of these must be set)
    grantee_user_id UUID REFERENCES users(id), -- Specific person
    grantee_email VARCHAR(255), -- Invite by email (before they sign up)
    grantee_organization_id UUID REFERENCES organizations(id), -- Entire org
    
    -- Scope of access
    access_level VARCHAR(30) NOT NULL DEFAULT 'query', 
    -- 'query' = can ask questions of the knowledge base
    -- 'read' = can read raw responses
    -- 'admin' = can manage the journal (for estate executors)
    
    -- Filters
    context_filter VARCHAR(20), -- NULL = all, 'personal' | 'business'
    category_filter UUID[], -- Limit to specific question categories
    date_range_start DATE, -- Only responses after this date
    date_range_end DATE, -- Only responses before this date
    
    -- AI Style
    allow_personality_mode BOOLEAN DEFAULT TRUE, -- Can they use voice/personality mode
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'pending' | 'revoked' | 'expired'
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Optional expiration
    
    -- Metadata
    relationship_label VARCHAR(100), -- 'spouse', 'child', 'colleague', 'successor'
    personal_message TEXT, -- Message from grantor to grantee
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_grantor ON access_grants(grantor_user_id);
CREATE INDEX idx_access_grantee ON access_grants(grantee_user_id);
CREATE INDEX idx_access_org ON access_grants(grantee_organization_id);
CREATE INDEX idx_access_status ON access_grants(status);

-- =============================================================
-- LEGACY CONTACTS (For deceased user management)
-- =============================================================

CREATE TABLE legacy_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id), -- The journal owner
    
    -- Legacy contact info
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    relationship VARCHAR(100), -- 'spouse', 'child', 'attorney', 'executor'
    
    -- Permissions upon activation
    can_manage_access BOOLEAN DEFAULT TRUE, -- Can grant/revoke access to others
    can_download_data BOOLEAN DEFAULT FALSE,
    can_delete_account BOOLEAN DEFAULT FALSE,
    
    -- Activation
    is_activated BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMPTZ,
    activated_by VARCHAR(50), -- 'self' | 'support' | 'legal'
    verification_method VARCHAR(50), -- 'death_certificate' | 'legal_document' | 'support_review'
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legacy_user ON legacy_contacts(user_id);

-- =============================================================
-- USER QUESTION HISTORY (Tracking what's been asked)
-- =============================================================

CREATE TABLE user_question_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    category_id UUID NOT NULL REFERENCES question_categories(id),
    
    -- What happened
    action VARCHAR(20) NOT NULL, -- 'answered' | 'skipped' | 'assigned'
    assigned_date DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, question_id, assigned_date)
);

CREATE INDEX idx_question_history_user ON user_question_history(user_id);
CREATE INDEX idx_question_history_category ON user_question_history(user_id, category_id);
CREATE INDEX idx_question_history_date ON user_question_history(user_id, assigned_date);

-- =============================================================
-- CATEGORY COVERAGE TRACKING
-- =============================================================

CREATE TABLE user_category_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES question_categories(id),
    
    questions_answered INTEGER DEFAULT 0,
    questions_skipped INTEGER DEFAULT 0,
    last_asked_at TIMESTAMPTZ,
    average_response_length INTEGER DEFAULT 0,
    total_response_time_seconds INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category_id)
);

CREATE INDEX idx_category_stats_user ON user_category_stats(user_id);

-- =============================================================
-- STREAKS & ENGAGEMENT
-- =============================================================

CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    current_streak INTEGER DEFAULT 0, -- Current consecutive days
    longest_streak INTEGER DEFAULT 0,
    total_days_active INTEGER DEFAULT 0,
    last_active_date DATE,
    
    -- Monthly stats
    current_month_responses INTEGER DEFAULT 0,
    current_month_words INTEGER DEFAULT 0,
    
    -- All-time stats
    total_responses INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_questions_skipped INTEGER DEFAULT 0,
    total_voice_responses INTEGER DEFAULT 0,
    total_time_journaling_seconds INTEGER DEFAULT 0,
    
    -- Milestones reached
    milestones_reached JSONB DEFAULT '[]', -- [{milestone: '100_responses', reached_at: '...'}]
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================================
-- NOTIFICATION LOG
-- =============================================================

CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL, -- 'daily_questions' | 'streak_reminder' | 'milestone' | 'access_request'
    title VARCHAR(200),
    body TEXT,
    
    -- Delivery
    channel VARCHAR(20) NOT NULL, -- 'push' | 'email' | 'in_app'
    push_message_id VARCHAR(200),
    delivery_status VARCHAR(20) DEFAULT 'sent', -- 'sent' | 'delivered' | 'failed' | 'opened'
    
    -- Reference
    reference_type VARCHAR(50), -- 'daily_set' | 'access_grant' | 'milestone'
    reference_id UUID,
    
    -- Metadata
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    failed_reason TEXT
);

CREATE INDEX idx_notifications_user ON notification_log(user_id);
CREATE INDEX idx_notifications_type ON notification_log(notification_type);
CREATE INDEX idx_notifications_sent ON notification_log(sent_at);

-- =============================================================
-- DEVICE TOKENS (For Push Notifications)
-- =============================================================

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    push_token TEXT NOT NULL, -- Expo push token
    device_type VARCHAR(20) NOT NULL, -- 'ios' | 'android'
    device_name VARCHAR(100),
    app_version VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(push_token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- =============================================================
-- VOICE STYLE PROFILES (For personality mode)
-- =============================================================

CREATE TABLE voice_style_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Computed from responses over time
    vocabulary_signature JSONB, -- Common phrases, words, expressions
    sentence_structure JSONB, -- Average sentence length, complexity
    tone_profile JSONB, -- Humor level, formality, warmth, directness
    topic_preferences JSONB, -- Topics they gravitate toward
    response_patterns JSONB, -- How they start/end responses, filler words
    
    -- Sample responses for few-shot prompting
    representative_responses UUID[], -- Best examples of their style
    
    -- Generation metadata
    responses_analyzed INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ,
    model_version VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================================
-- AUDIT LOG
-- =============================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who did what
    actor_user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'response.create', 'access.grant', 'query.execute', etc.
    
    -- What was affected
    resource_type VARCHAR(50) NOT NULL, -- 'response', 'access_grant', 'wisdom_query', etc.
    resource_id UUID,
    
    -- Details
    details JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor_user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =============================================================
-- FEEDBACK & REPORTING
-- =============================================================

CREATE TABLE question_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    
    feedback_type VARCHAR(30) NOT NULL, -- 'too_easy' | 'too_hard' | 'irrelevant' | 'offensive' | 'great' | 'confusing'
    feedback_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- WAITLIST (Pre-launch)
-- =============================================================

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200),
    interest_type VARCHAR(20) DEFAULT 'personal', -- 'personal' | 'business' | 'both'
    referral_source VARCHAR(100),
    referral_code VARCHAR(50),
    referred_by UUID REFERENCES waitlist(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting' | 'invited' | 'converted'
    invited_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    
    position INTEGER, -- Queue position
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
```

### 4.2 Database Functions & Triggers

```sql
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orgs_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_responses_updated BEFORE UPDATE ON responses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_access_updated BEFORE UPDATE ON access_grants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Compute word count on response insert/update
CREATE OR REPLACE FUNCTION compute_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(regexp_split_to_array(trim(NEW.response_text), '\s+'), 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_response_word_count BEFORE INSERT OR UPDATE OF response_text ON responses 
    FOR EACH ROW EXECUTE FUNCTION compute_word_count();

-- Update user streak stats after response
CREATE OR REPLACE FUNCTION update_streak_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_streaks (user_id, total_responses, total_words, last_active_date)
    VALUES (NEW.user_id, 1, NEW.word_count, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        total_responses = user_streaks.total_responses + 1,
        total_words = user_streaks.total_words + COALESCE(NEW.word_count, 0),
        last_active_date = CURRENT_DATE,
        current_streak = CASE 
            WHEN user_streaks.last_active_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
            WHEN user_streaks.last_active_date = CURRENT_DATE THEN user_streaks.current_streak
            ELSE 1
        END,
        longest_streak = GREATEST(
            user_streaks.longest_streak,
            CASE 
                WHEN user_streaks.last_active_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
                WHEN user_streaks.last_active_date = CURRENT_DATE THEN user_streaks.current_streak
                ELSE 1
            END
        ),
        total_days_active = CASE
            WHEN user_streaks.last_active_date < CURRENT_DATE THEN user_streaks.total_days_active + 1
            ELSE user_streaks.total_days_active
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_streaks AFTER INSERT ON responses 
    FOR EACH ROW EXECUTE FUNCTION update_streak_stats();

-- Update category stats after response
CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
BEGIN
    SELECT category_id INTO v_category_id FROM questions WHERE id = NEW.question_id;
    
    INSERT INTO user_category_stats (user_id, category_id, questions_answered, last_asked_at)
    VALUES (NEW.user_id, v_category_id, 1, NOW())
    ON CONFLICT (user_id, category_id) DO UPDATE SET
        questions_answered = user_category_stats.questions_answered + 1,
        last_asked_at = NOW(),
        average_response_length = (
            (user_category_stats.average_response_length * user_category_stats.questions_answered + COALESCE(NEW.word_count, 0))
            / (user_category_stats.questions_answered + 1)
        ),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_category_stats AFTER INSERT ON responses 
    FOR EACH ROW EXECUTE FUNCTION update_category_stats();
```

---

## 5. API STRUCTURE

### 5.1 API Conventions

- **Base URL:** `https://api.wisdomjournal.com/v1`
- **Auth:** Bearer token (JWT) in Authorization header
- **Format:** JSON request/response bodies
- **Pagination:** Cursor-based using `?cursor=<id>&limit=20`
- **Errors:** Standard format `{ error: { code, message, details } }`
- **Rate Limiting:** 100 req/min for standard, 300 req/min for premium

### 5.2 Authentication Endpoints

```
POST   /v1/auth/register          -- Create new account
POST   /v1/auth/login              -- Email/password login
POST   /v1/auth/login/google       -- Google OAuth
POST   /v1/auth/login/apple        -- Apple Sign-In
POST   /v1/auth/refresh            -- Refresh JWT token
POST   /v1/auth/forgot-password    -- Request password reset
POST   /v1/auth/reset-password     -- Complete password reset
POST   /v1/auth/verify-email       -- Verify email address
DELETE /v1/auth/session            -- Logout (invalidate token)
```

### 5.3 User Endpoints

```
GET    /v1/users/me                       -- Get current user profile
PATCH  /v1/users/me                       -- Update profile
PATCH  /v1/users/me/preferences           -- Update notification/question preferences
DELETE /v1/users/me                       -- Soft delete account
GET    /v1/users/me/stats                 -- Get streak, total responses, etc.
GET    /v1/users/me/streaks               -- Get detailed streak info
GET    /v1/users/me/milestones            -- Get milestones achieved
POST   /v1/users/me/avatar               -- Upload avatar image
```

### 5.4 Question & Response Endpoints (Core Flow)

```
-- Daily Questions
GET    /v1/daily                           -- Get today's question set
POST   /v1/daily/generate                  -- Force-generate today's set (if not exists)
GET    /v1/daily/history                   -- Get past daily sets with completion status
GET    /v1/daily/:date                     -- Get a specific day's set (YYYY-MM-DD)

-- Responding
POST   /v1/responses                       -- Submit a response to a question
GET    /v1/responses                       -- List my responses (paginated)
GET    /v1/responses/:id                   -- Get a specific response
PUT    /v1/responses/:id                   -- Edit a response (updates raw text, re-embeds)
DELETE /v1/responses/:id                   -- Soft delete a response

-- Voice Responses
POST   /v1/responses/voice                 -- Upload audio response
GET    /v1/responses/:id/audio             -- Get audio file URL
POST   /v1/responses/:id/retranscribe     -- Re-run transcription

-- Question Feedback
POST   /v1/questions/:id/feedback          -- Submit feedback on a question
POST   /v1/questions/:id/skip              -- Mark question as skipped
```

### 5.5 Wisdom Query Endpoints (The "Ask" Feature)

```
POST   /v1/wisdom/query                    -- Ask a question of someone's knowledge base
GET    /v1/wisdom/queries                  -- List my past queries
GET    /v1/wisdom/queries/:id              -- Get a specific query with sources
POST   /v1/wisdom/queries/:id/feedback     -- Rate/feedback on a query response

-- Query Request Body:
-- {
--   "target_user_id": "uuid",              -- Whose wisdom to query
--   "query_text": "How would dad handle...",
--   "response_style": "personality",        -- 'personality' | 'neutral'
--   "context": "personal",                  -- 'personal' | 'business'
--   "organization_id": "uuid"               -- If business context
-- }
--
-- Query Response Body:
-- {
--   "id": "uuid",
--   "query_text": "...",
--   "response": {
--     "text": "Based on their journal entries...",
--     "style": "personality",
--     "confidence": 0.85,
--     "sources": [
--       {
--         "response_id": "uuid",
--         "response_excerpt": "...",
--         "question_asked": "...",
--         "response_date": "2025-03-15",
--         "relevance_score": 0.92
--       }
--     ]
--   }
-- }
```

### 5.6 Access Control Endpoints

```
-- Managing who can query your wisdom
GET    /v1/access                          -- List all access grants I've given
POST   /v1/access                          -- Grant someone access
GET    /v1/access/:id                      -- Get specific grant details
PATCH  /v1/access/:id                      -- Modify grant (scope, expiration)
DELETE /v1/access/:id                      -- Revoke access

-- Managing access I've been given
GET    /v1/access/received                 -- List journals I have access to
POST   /v1/access/received/:id/accept      -- Accept an access invitation

-- Legacy contacts
GET    /v1/legacy-contacts                 -- List my legacy contacts
POST   /v1/legacy-contacts                -- Add a legacy contact
PATCH  /v1/legacy-contacts/:id             -- Update legacy contact
DELETE /v1/legacy-contacts/:id             -- Remove legacy contact
POST   /v1/legacy-contacts/:id/activate    -- Activate legacy contact (with verification)
```

### 5.7 Organization Endpoints (Business)

```
-- Organization management
POST   /v1/organizations                   -- Create organization
GET    /v1/organizations/:id               -- Get org details
PATCH  /v1/organizations/:id               -- Update org
DELETE /v1/organizations/:id               -- Delete org

-- Members
GET    /v1/organizations/:id/members       -- List members
POST   /v1/organizations/:id/members       -- Invite member
PATCH  /v1/organizations/:id/members/:mid  -- Update member role/framework
DELETE /v1/organizations/:id/members/:mid  -- Remove member
POST   /v1/organizations/:id/members/:mid/depart  -- Mark member as departed

-- Knowledge Transfer
POST   /v1/organizations/:id/transfer      -- Initiate knowledge transfer
GET    /v1/organizations/:id/transfer/:tid -- Get transfer status
POST   /v1/organizations/:id/transfer/:tid/assign-successor -- Assign successor

-- Analytics (org admins)
GET    /v1/organizations/:id/analytics     -- Usage stats, completion rates
GET    /v1/organizations/:id/analytics/engagement -- Per-member engagement
GET    /v1/organizations/:id/analytics/coverage   -- Knowledge coverage gaps
```

### 5.8 Question Framework Endpoints

```
GET    /v1/frameworks                      -- List available frameworks
GET    /v1/frameworks/:id                  -- Get framework details
GET    /v1/frameworks/:id/categories       -- Get categories in framework

-- Admin only
POST   /v1/admin/frameworks                -- Create framework
PATCH  /v1/admin/frameworks/:id            -- Update framework
POST   /v1/admin/questions                 -- Add seed question
PATCH  /v1/admin/questions/:id             -- Update question
GET    /v1/admin/questions/review          -- Questions pending review
POST   /v1/admin/questions/:id/review      -- Approve/reject question
```

### 5.9 Notification Endpoints

```
POST   /v1/devices                         -- Register device token
DELETE /v1/devices/:token                  -- Unregister device
PATCH  /v1/users/me/notification-settings  -- Update notification preferences
GET    /v1/notifications                   -- Get notification history
```

### 5.10 Search & Discovery Endpoints

```
GET    /v1/search/responses                -- Full-text search my responses
GET    /v1/search/topics                   -- Get topics I've covered
GET    /v1/search/timeline                 -- Timeline view of my journal
GET    /v1/search/categories               -- Browse by category with stats
```

### 5.11 Export & Data Portability

```
POST   /v1/export                          -- Request data export
GET    /v1/export/:id                      -- Check export status
GET    /v1/export/:id/download             -- Download export file (JSON/PDF)
```

### 5.12 API Request/Response Examples

**Submit a Response:**
```json
// POST /v1/responses
// Request:
{
  "question_id": "550e8400-e29b-41d4-a716-446655440000",
  "daily_item_id": "550e8400-e29b-41d4-a716-446655440001",
  "response_text": "You know, I think the hardest decision I ever made was leaving my job at Boeing. Everyone thought I was crazy. My wife supported me though, she said 'if you don't try now you never will.' I was 34 and we had two kids and I just... I knew if I stayed there another year I'd be there forever. So I put in my two weeks and started my consulting firm out of our garage. Best decision I ever made, even though that first year was absolutely terrifying.",
  "input_method": "text",
  "started_at": "2026-02-25T14:30:00Z",
  "completed_at": "2026-02-25T14:37:22Z",
  "platform": "ios"
}

// Response:
{
  "id": "660e8400-e29b-41d4-a716-446655440099",
  "user_id": "...",
  "question_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_text": "You know, I think the hardest decision I ever made was leaving my job at Boeing...",
  "word_count": 98,
  "input_method": "text",
  "response_time_seconds": 442,
  "created_at": "2026-02-25T14:37:22Z"
}
```

**Query Someone's Wisdom:**
```json
// POST /v1/wisdom/query
// Request:
{
  "target_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "query_text": "Dad, I'm thinking about leaving my corporate job to start a business. What would you say?",
  "response_style": "personality",
  "context": "personal"
}

// Response:
{
  "id": "770e8400-e29b-41d4-a716-446655440055",
  "query_text": "Dad, I'm thinking about leaving my corporate job to start a business. What would you say?",
  "response": {
    "text": "Look, you know I did the exact same thing when I was about your age. I left Boeing when everyone thought I was crazy, and your mom was the one who told me 'if you don't try now you never will.' That first year was absolutely terrifying — we were running the consulting firm out of the garage with two kids. But here's the thing: I knew if I stayed one more year, I'd stay forever. So if you're feeling that pull, that's telling you something. Just make sure you've got your spouse on board and some runway saved up. That makes all the difference.",
    "style": "personality",
    "confidence": 0.91,
    "sources": [
      {
        "response_id": "660e8400-e29b-41d4-a716-446655440099",
        "response_excerpt": "...the hardest decision I ever made was leaving my job at Boeing...",
        "question_asked": "What's the biggest risk you've ever taken in your career?",
        "response_date": "2026-02-25",
        "relevance_score": 0.95
      },
      {
        "response_id": "660e8400-e29b-41d4-a716-446655440120",
        "response_excerpt": "...first year of the business I think we made about $30k total...",
        "question_asked": "Tell me about a time when financial stress tested your character.",
        "response_date": "2026-03-12",
        "relevance_score": 0.82
      }
    ]
  }
}
```

---

## 6. QUESTION ENGINE

### 6.1 Question Selection Algorithm

The question engine selects each day's questions using a multi-factor scoring system:

```
DAILY QUESTION SELECTION ALGORITHM
===================================

Input: user_id, date, question_count (default 5)
Output: Ordered list of question_ids

Step 1: CANDIDATE POOL
  - Get user's active framework (personal or business)
  - Pull all active questions matching framework categories
  - Exclude questions answered in the last 30 days
  - Exclude questions skipped in the last 14 days

Step 2: SCORE EACH CANDIDATE
  For each question, compute score:
  
  score = (category_need * 0.35) + 
          (difficulty_balance * 0.20) + 
          (recency_bonus * 0.15) + 
          (quality_score * 0.15) + 
          (follow_up_relevance * 0.10) +
          (randomness * 0.05)
  
  Where:
  - category_need: Higher if user has low coverage in this category
    = 1.0 - (user_category_responses / avg_category_responses)
    Clamped to [0.0, 1.0]
    
  - difficulty_balance: Prefer mixing difficulties
    If last 3 days were mostly 'easy', boost 'deep' questions
    If user is new (< 14 days), boost 'easy' and 'medium'
    
  - recency_bonus: Boost questions from categories not asked recently
    = days_since_category_last_asked / 30, clamped to [0, 1]
    
  - quality_score: From the question's aggregate quality metrics
    = question.quality_score (pre-computed from skip rates, response lengths)
    
  - follow_up_relevance: If this question relates to a recent response
    Detected via topic overlap between question categories and recent response ai_topics
    
  - randomness: Small random factor to prevent predictability
    = random(0.0, 1.0)

Step 3: DIVERSITY CONSTRAINTS
  - No more than 2 questions from the same category
  - At least 1 'easy' or 'medium' question
  - At least 1 'deep' or 'challenging' question
  - Max 1 'heavy' emotional weight question per day
  
Step 4: SPECIAL INSERTIONS (override one slot if applicable)
  - If AI detected an interesting topic in yesterday's responses,
    generate a follow-up question and insert it as position 1
  - If user completed a milestone, insert a celebration/reflection question
  - If it's a special date (birthday, anniversary - from profile), 
    insert a date-appropriate question

Step 5: ORDER
  - Position 1: Warmup — easiest/lightest question
  - Position 2-4: Mix of medium to deep
  - Position 5: Reflective or challenging — the "big question"

Step 6: PERSIST
  - Create daily_question_set
  - Create daily_question_items for each question
  - Log to user_question_history
  - Schedule notification
```

### 6.2 Question Categories (Seed Data)

**Personal Categories:**

| Category | Description | Example Questions |
|----------|-------------|-------------------|
| Values & Beliefs | Core principles, moral compass | "What value do you hope you've passed on to the people closest to you?" |
| Life Stories | Key moments, memories | "What's a small moment from your childhood that shaped who you are?" |
| Career & Work | Professional journey, lessons | "What's the best professional advice you ever received?" |
| Relationships | Family, friends, love | "What's the most important thing you've learned about maintaining friendships?" |
| Wisdom & Advice | What they'd tell others | "If you could go back and tell your 25-year-old self one thing, what would it be?" |
| Daily Life | Routines, preferences, habits | "What does your ideal Sunday morning look like?" |
| Challenges & Growth | Hardships, resilience | "What failure taught you the most?" |
| Hopes & Dreams | Aspirations, wishes | "What's something you still want to accomplish?" |
| Humor & Joy | Fun, lightness | "What's the funniest misunderstanding you've ever been part of?" |
| Hypotheticals | Creative thinking | "If you could have dinner with anyone from history, who and why?" |
| Culture & Identity | Heritage, traditions | "What tradition from your family do you hope continues?" |
| Health & Wellbeing | Physical, mental health | "What habit has contributed most to your wellbeing?" |

**Business Categories:**

| Category | Description | Example Questions |
|----------|-------------|-------------------|
| Decision Framework | How and why decisions are made | "Walk me through how you evaluate a major budget request." |
| Stakeholder Management | Key relationships | "Who are the most important external partners and how do you manage them?" |
| Process & Workflow | How things get done | "What's your process for quarterly planning?" |
| Institutional Knowledge | Things only you know | "What are the unwritten rules of this organization?" |
| Risk Assessment | How risk is evaluated | "What risks keep you up at night and how do you monitor them?" |
| Team Management | People leadership | "How do you handle underperformance on your team?" |
| Industry Context | Domain expertise | "What industry trends should my successor understand?" |
| Vendor & Tool Knowledge | Technical stack, partners | "Why did we choose our current vendors and what are the alternatives?" |
| Crisis Management | Emergency playbooks | "Walk me through how you'd handle a major service outage." |
| Strategic Thinking | Long-term vision | "What does success look like for this department in 3 years?" |

### 6.3 AI-Generated Follow-Up Questions

After a user submits a response, a background job analyzes it and may generate follow-up questions:

```
FOLLOW-UP GENERATION ALGORITHM
================================

Input: response_text, question_asked, user_history
Output: 0-2 follow-up questions (stored with is_seed = false)

Process:
1. Extract key entities, decisions, people mentioned
2. Check if any extracted topics are under-explored in user's history
3. If follow-up worthy, generate using LLM:

Prompt:
"A person was asked: '{question_asked}'
They responded: '{response_text}'

Based on their response, generate 1-2 follow-up questions that would:
- Dig deeper into a specific detail they mentioned
- Explore the reasoning behind a decision they referenced
- Capture additional context about a person or event they named
- Challenge them to think about it from a different angle

Rules:
- Keep questions conversational and warm
- Don't make them feel interrogated
- Each question should stand alone (could be asked on a different day)
- Match the difficulty level: {user_preferred_difficulty}"
```

---

## 7. AI RETRIEVAL & SYNTHESIS ENGINE

### 7.1 Query Processing Pipeline

When someone queries a person's wisdom:

```
QUERY PIPELINE
===============

Input: query_text, target_user_id, response_style, context
Output: Synthesized response with source citations

Step 1: PERMISSION CHECK
  - Verify querier has active access_grant to target_user_id
  - Check access_level allows querying
  - Apply any filters (context, categories, date range)

Step 2: QUERY EMBEDDING
  - Generate embedding of query_text using text-embedding-3-large
  
Step 3: VECTOR SEARCH
  - Search response_embeddings where user_id = target_user_id
  - Apply any scope filters from access_grant
  - Retrieve top 20 nearest neighbors (cosine similarity)
  - Threshold: similarity > 0.70

Step 4: RE-RANKING
  - For each candidate, compute combined score:
    combined = (vector_similarity * 0.5) + 
               (recency_score * 0.15) + 
               (response_depth * 0.20) + 
               (topic_match * 0.15)
  - recency_score: More recent responses get slight boost
  - response_depth: Longer, more detailed responses preferred
  - topic_match: BM25 text search score for keyword overlap
  
Step 5: SELECT TOP SOURCES
  - Take top 5-8 responses as source material
  - Ensure diversity: no more than 3 from the same question category

Step 6: SYNTHESIS
  - Build prompt with:
    a. The original query
    b. The target user's voice_style_profile (if personality mode)
    c. The selected source responses (full text)
    d. The questions that prompted those responses
    
  Personality Mode Prompt:
  "You are synthesizing a response as if you were {user_name}. 
   Based on their journal entries below, respond to this question 
   in their voice and style.
   
   Style guide:
   - Vocabulary: {vocabulary_signature}
   - Tone: {tone_profile}
   - Typical phrases: {common_phrases}
   - Response pattern: {response_patterns}
   
   Important: Ground your response ONLY in what they've actually said. 
   Do not invent new opinions or experiences. If the journal doesn't 
   contain enough information to answer, say so honestly.
   
   Their journal entries relevant to this question:
   ---
   [Entry 1 - Date, Question Asked]
   {full response text}
   ---
   [Entry 2 - Date, Question Asked]  
   {full response text}
   ---
   
   Question being asked: {query_text}
   
   Respond as {user_name} would, based on their recorded wisdom."
   
  Neutral Mode Prompt:
  "Based on the following journal entries from {user_name}, 
   provide a helpful synthesis answering this question. 
   Cite specific entries where relevant. Speak in third person
   about {user_name}.
   
   [Same source entries]
   
   Question: {query_text}"

Step 7: CONFIDENCE SCORING
  - Average vector similarity of sources used
  - Number of relevant sources found
  - Coverage: does the source material actually address the query?
  - If confidence < 0.50, prepend disclaimer:
    "I don't have strong information on this specific topic, 
     but based on what's been recorded..."

Step 8: PERSIST & RETURN
  - Save to wisdom_queries table
  - Include source_response_ids
  - Return response with sources for transparency
```

### 7.2 Voice Style Profile Generation

Runs as a background job after every 20 new responses:

```
VOICE STYLE ANALYSIS
=====================

Input: All responses from user
Output: Updated voice_style_profile

Analysis Dimensions:
1. Vocabulary Signature
   - Most frequent unique words (beyond common English)
   - Catchphrases and repeated expressions
   - Filler words ("you know", "I mean", "like")
   - Slang or regional language

2. Sentence Structure
   - Average sentence length
   - Use of complex vs. simple sentences
   - Fragmented sentences frequency
   - Use of parentheticals and asides

3. Tone Profile (scored 0-10)
   - Formality: casual ←→ formal
   - Humor: serious ←→ humorous
   - Directness: indirect ←→ blunt
   - Warmth: reserved ←→ warm
   - Optimism: pessimistic ←→ optimistic
   - Storytelling: factual ←→ narrative

4. Response Patterns
   - How they typically start responses
   - How they typically end responses
   - Do they ask rhetorical questions?
   - Do they use analogies/metaphors?
   - Do they reference specific people often?

5. Representative Responses
   - Select 5-10 responses that best capture their style
   - Diverse in topic but consistent in voice
   - Used for few-shot prompting during synthesis
```

---

## 8. MOBILE APP ARCHITECTURE

### 8.1 React Native Project Structure

```
wisdom-journal-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth flow screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── onboarding/
│   │       ├── welcome.tsx
│   │       ├── choose-type.tsx   # Personal vs Business
│   │       ├── select-framework.tsx
│   │       ├── set-preferences.tsx
│   │       └── first-questions.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── today.tsx             # Daily questions (home screen)
│   │   ├── journal.tsx           # Browse past responses
│   │   ├── ask.tsx               # Query someone's wisdom
│   │   └── profile.tsx           # Settings & stats
│   ├── question/
│   │   └── [id].tsx              # Individual question response screen
│   ├── response/
│   │   └── [id].tsx              # View a specific response
│   ├── wisdom/
│   │   ├── [userId].tsx          # Browse someone's wisdom
│   │   └── query/[id].tsx        # View query result
│   ├── access/
│   │   ├── manage.tsx            # Manage who can access my wisdom
│   │   └── grant.tsx             # Grant new access
│   ├── organization/
│   │   ├── [id]/
│   │   │   ├── dashboard.tsx
│   │   │   ├── members.tsx
│   │   │   └── analytics.tsx
│   │   └── create.tsx
│   └── _layout.tsx               # Root layout
│
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Text.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── CloudBackground.tsx   # Animated cloud background
│   │   └── StreakIndicator.tsx
│   ├── questions/
│   │   ├── QuestionCard.tsx      # Single question display
│   │   ├── QuestionList.tsx      # Today's question list
│   │   ├── ResponseInput.tsx     # Text input for responses
│   │   ├── VoiceRecorder.tsx     # Voice capture component
│   │   └── ProgressDots.tsx      # 5-dot progress indicator
│   ├── journal/
│   │   ├── ResponseCard.tsx      # Past response preview
│   │   ├── TimelineView.tsx      # Chronological view
│   │   ├── CategoryFilter.tsx    # Filter by category
│   │   └── SearchBar.tsx         # Search responses
│   ├── wisdom/
│   │   ├── QueryInput.tsx        # Ask a question
│   │   ├── QueryResult.tsx       # Display AI response
│   │   ├── SourceCard.tsx        # Show source responses
│   │   └── StyleToggle.tsx       # Personality vs neutral
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── LoadingCloud.tsx      # Cloud-themed loading
│   │   ├── EmptyState.tsx
│   │   ├── NotificationBanner.tsx
│   │   └── StreakCelebration.tsx  # Streak milestone animation
│   └── onboarding/
│       ├── WelcomeSlide.tsx
│       └── TypeSelector.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useDailyQuestions.ts
│   ├── useResponses.ts
│   ├── useWisdomQuery.ts
│   ├── useNotifications.ts
│   ├── useVoiceRecording.ts
│   ├── useStreaks.ts
│   └── useOrganization.ts
│
├── services/
│   ├── api/
│   │   ├── client.ts             # Axios/fetch wrapper with auth
│   │   ├── auth.ts
│   │   ├── questions.ts
│   │   ├── responses.ts
│   │   ├── wisdom.ts
│   │   ├── access.ts
│   │   ├── organizations.ts
│   │   └── notifications.ts
│   ├── storage/
│   │   ├── secure.ts             # Secure token storage
│   │   └── cache.ts              # Offline cache
│   ├── notifications/
│   │   ├── setup.ts              # Expo Notifications setup
│   │   ├── handlers.ts           # Notification tap handlers
│   │   └── scheduler.ts          # Local notification scheduling
│   └── audio/
│       ├── recorder.ts           # Voice recording
│       ├── player.ts             # Audio playback
│       └── upload.ts             # Audio upload to Supabase Storage
│
├── store/                        # Zustand state management
│   ├── authStore.ts
│   ├── questionStore.ts
│   ├── responseStore.ts
│   └── uiStore.ts
│
├── theme/
│   ├── colors.ts                 # Color palette
│   ├── typography.ts             # Font definitions
│   ├── spacing.ts                # Spacing scale
│   └── shadows.ts                # Shadow definitions
│
├── utils/
│   ├── dates.ts
│   ├── formatting.ts
│   └── validation.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   │   ├── clouds/               # Cloud illustrations
│   │   ├── onboarding/
│   │   └── empty-states/
│   └── animations/               # Lottie files
│       ├── loading-cloud.json
│       ├── streak-celebration.json
│       └── milestone.json
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── package.json
└── tsconfig.json
```

### 8.2 Key Screen Flows

**Daily Question Flow:**
```
1. User opens app (or taps notification)
   → Show today's questions with progress dots (○ ○ ○ ○ ○)
   
2. Tap question #1
   → Full-screen question display
   → Text input (auto-expanding) or voice record button
   → Timer shows how long they've been responding (unobtrusive)
   → "Save" button (no character limit)
   
3. After saving:
   → Brief celebration animation (subtle cloud burst)
   → Progress dot fills (● ○ ○ ○ ○)
   → Navigate to question #2 or back to list
   
4. After completing all 5:
   → Streak celebration if applicable
   → "Come back tomorrow" with cloud animation
   → Option to browse past responses or ask a question
```

**Voice Response Flow:**
```
1. Tap microphone icon on question screen
2. Recording indicator with waveform visualization
3. User speaks their response (no time limit)
4. Tap stop → Review screen:
   - Play back audio
   - See real-time transcription appearing
   - Option to re-record or edit text
5. Confirm → Saves both audio file and transcription as response_text
   → Audio uploaded to Supabase Storage in background
```

---

## 9. PUSH NOTIFICATION SYSTEM

### 9.1 Notification Types

| Type | Trigger | Default Time | Content |
|------|---------|--------------|---------|
| `daily_questions` | New questions generated | User's preferred time | "Your 5 questions are ready! Today's first: '{question_short}'" |
| `streak_reminder` | 6pm if questions unanswered | 6:00 PM local | "Don't break your {X}-day streak! You have {N} questions left today." |
| `streak_milestone` | Streak hits milestone | Immediate | "🌤️ {X}-day streak! You're building something incredible." |
| `response_milestone` | Total response milestone | Immediate | "You've recorded {X} wisdom entries! That's a book's worth of experience." |
| `access_request` | Someone requests access | Immediate | "{Name} would like to access your Wisdom Journal." |
| `new_query` | Someone queries your wisdom | Immediate | "{Name} asked your wisdom a question." |
| `weekly_summary` | Weekly digest | Sunday 10am | "This week you answered {X} questions across {Y} categories." |
| `gentle_return` | Inactive 3+ days | 10:00 AM local | "We have some new questions waiting for you when you're ready." |
| `knowledge_gap` | Category under-explored | With daily Qs | "We noticed you haven't shared much about {category} yet." |

### 9.2 Notification Content in Push

The daily notification should contain the first question directly:

```json
{
  "to": "ExponentPushToken[xxxxx]",
  "title": "Your Wisdom Journal",
  "body": "What's the best advice you ever ignored? 📖 + 4 more questions today",
  "data": {
    "type": "daily_questions",
    "daily_set_id": "uuid",
    "first_question_id": "uuid",
    "questions_count": 5
  }
}
```

### 9.3 Notification Scheduling

```
NOTIFICATION SCHEDULER (runs via cron every 15 minutes)
========================================================

For each user where notification_enabled = true:

1. Check user's timezone and preferred_notification_time
2. If current time matches (within 15-min window):
   a. Check if today's daily_question_set exists
   b. If not, generate it (trigger question engine)
   c. If questions exist and notification not yet sent:
      - Send push notification
      - Log to notification_log
      - Update daily_question_set.notification_sent = true

Streak Reminder Logic:
- At 6pm user's local time, if daily set status != 'complete':
  - Send streak reminder
  - Only send if current_streak > 0 (they have something to lose)
  
Gentle Return Logic:
- Daily check: if user.last_active_at < (now - 3 days):
  - Send gentle return notification
  - Max 1 per week
  - After 4 weeks inactive, stop notifications entirely
```

---

## 10. VOICE CAPTURE & PROCESSING

### 10.1 Voice Recording Pipeline

```
1. User taps record button
2. React Native Audio Recorder captures audio (m4a/wav)
3. Audio streamed/saved locally
4. On stop:
   a. Upload audio file to Supabase Storage (signed URL)
   b. Send audio to transcription service (Whisper API or Deepgram)
   c. Receive transcription
   d. Display transcription for user review
5. User confirms or edits transcription
6. Save:
   - response_text = confirmed transcription (EXACTLY as approved)
   - audio_file_url = Supabase Storage URL
   - audio_transcription_raw = original unedited transcription
   - audio_duration_seconds = recording length
   - input_method = 'voice'
```

### 10.2 Audio Storage

- Format: m4a (compressed) for storage, wav during recording
- Storage: Supabase Storage (private bucket)
- Retention: Indefinite for premium users, 1 year for free tier
- Access: Signed URLs with 1-hour expiration
- Encryption: AES-256 at rest, TLS in transit

---

## 11. UI/UX DESIGN SYSTEM

### 11.1 Design Philosophy

**"A warm cloud that holds your most important thoughts."**

The app should feel like opening a journal in a peaceful sky. Soft, calming, family-friendly. Not clinical, not corporate. The kind of thing a grandparent and a teenager would both feel comfortable using.

### 11.2 Color Palette

```
Primary Colors:
  Cloud White:    #FAFBFF  -- Primary background
  Sky Blue:       #7CB9E8  -- Primary brand color
  Soft Blue:      #B8D4E8  -- Secondary surfaces
  Deep Sky:       #4A90D9  -- CTAs, active states
  Twilight:       #2C3E6B  -- Headers, primary text

Accent Colors:
  Sunrise Peach:  #FFD4B8  -- Warm accents, celebrations
  Morning Gold:   #FFE4A0  -- Streak indicators, milestones
  Sage Green:     #A8D5BA  -- Success states, completed
  Lavender:       #C5B4E3  -- Category accents
  Rose:           #E8B4C8  -- Emotional/personal categories

Neutral Colors:
  Text Primary:   #2C3E6B  -- (Twilight)
  Text Secondary: #6B7B9E
  Text Muted:     #9EABC2
  Border:         #E2E8F4
  Surface:        #F0F4FA
  Background:     #FAFBFF

Semantic Colors:
  Success:        #5CB85C
  Warning:        #F0AD4E
  Error:          #D9534F
  Info:           #5BC0DE
```

### 11.3 Typography

```
Font Family:
  Display/Headers: "Nunito" -- Rounded, warm, friendly
  Body:            "Nunito Sans" -- Clean, readable, pairs perfectly
  Mono (code):     Not needed (no code in this app)

Scale:
  Display Large:  32px / 40px line-height / Bold
  Display:        28px / 36px / Bold
  Title:          22px / 28px / SemiBold
  Headline:       18px / 24px / SemiBold
  Body Large:     17px / 26px / Regular    -- For response text
  Body:           15px / 22px / Regular    -- Default
  Body Small:     13px / 18px / Regular
  Caption:        11px / 16px / Medium
  
Special:
  Question Text:  20px / 30px / SemiBold / Twilight color
  Response Input: 17px / 26px / Regular / Text Primary
  Streak Number:  48px / 1.0 / Bold / Morning Gold
```

### 11.4 Spacing Scale

```
4px   -- xs   (tight padding, icon gaps)
8px   -- sm   (between related elements)
12px  -- md   (standard padding)
16px  -- lg   (card padding, section gaps)
24px  -- xl   (between sections)
32px  -- 2xl  (screen section gaps)
48px  -- 3xl  (hero spacing)
64px  -- 4xl  (screen top padding)
```

### 11.5 Component Design Tokens

```
Border Radius:
  Small:    8px   (buttons, inputs)
  Medium:   12px  (cards)
  Large:    16px  (modals, sheets)
  Full:     9999px (pills, avatars)

Shadows:
  Subtle:   0 1px 3px rgba(44, 62, 107, 0.06)
  Card:     0 2px 8px rgba(44, 62, 107, 0.08)
  Elevated: 0 4px 16px rgba(44, 62, 107, 0.12)
  Cloud:    0 8px 32px rgba(124, 185, 232, 0.15)  -- Cloud-like floating

Animations:
  Duration Fast:    150ms
  Duration Normal:  250ms
  Duration Slow:    400ms
  Easing Default:   cubic-bezier(0.4, 0, 0.2, 1)
  Easing Bounce:    cubic-bezier(0.34, 1.56, 0.64, 1)  -- For celebrations
```

### 11.6 Key Screen Designs

**Today Screen (Home):**
- Soft gradient background (Cloud White → Soft Blue)
- Floating cloud illustrations (subtle, animated drift)
- Greeting: "Good morning, {name}" with current streak
- 5 question cards stacked vertically
- Each card shows: question preview, category icon, dot indicator (answered/not)
- Progress bar at top: "3 of 5 completed today"
- Gentle pulse animation on next unanswered question

**Question Response Screen:**
- Full-screen, minimal distractions
- Question text prominent at top (large, centered)
- Category pill label below question
- Large text input area (auto-expanding, no character limit)
- Microphone button for voice recording
- Subtle timer in corner (how long they've been responding)
- "Save" button (disabled until content entered)
- "Skip" option (small, unobtrusive)

**Journal Browser:**
- Calendar strip at top for date navigation
- Cards showing responses grouped by date
- Each card: question asked (small), response preview (2-3 lines)
- Category color indicator on left edge
- Search bar with full-text search
- Filter by category, date range, voice vs. text

**Ask Screen (Wisdom Query):**
- Clean input: "Ask {name}'s wisdom a question..."
- Toggle: Personality Mode ↔ Neutral Mode
- Previous queries listed below
- Query result: AI response + collapsible source cards
- Source cards show: original question, response excerpt, date

---

## 12. SECURITY & PRIVACY ARCHITECTURE

### 12.1 Data Encryption

- **At rest:** AES-256 encryption on all database storage
- **In transit:** TLS 1.3 for all API communication
- **Audio files:** Encrypted at rest in Supabase Storage with server-side encryption
- **Embeddings:** Stored in same encrypted PostgreSQL instance
- **Backups:** Encrypted with separate key rotation schedule

### 12.2 Authentication & Authorization

- JWT tokens with 15-minute access token, 7-day refresh token
- Refresh token rotation (each use invalidates the old one)
- Password hashing: bcrypt with cost factor 12
- Multi-factor auth optional (TOTP)
- Session management via Redis

### 12.3 Access Control Model

```
Permission Hierarchy:
  
  JOURNAL OWNER
    └── Full control over their journal
    └── Can grant/revoke access to anyone
    └── Can set scope limits on access
    └── Can designate legacy contacts
    └── Can enable/disable personality mode globally
  
  LEGACY CONTACT (activated)
    └── Can manage access grants on behalf of deceased user
    └── Can download data (if permitted)
    └── Can delete account (if permitted)
    └── Cannot modify journal entries
  
  ACCESS GRANTEE
    └── query: Can ask questions, see synthesized responses
    └── read: Can see raw journal entries (within scope)
    └── Cannot modify anything
  
  ORGANIZATION ADMIN
    └── Can manage members and frameworks
    └── Can view aggregate analytics
    └── Cannot read individual responses without explicit grant
    └── Can initiate knowledge transfer
  
  ORGANIZATION MEMBER
    └── Answers their own questions
    └── Manages their own access grants
    └── Can query colleagues who've granted them access
```

### 12.4 Privacy Controls

- Users can delete any response at any time (hard delete from DB, remove embeddings)
- Users can export all their data (GDPR/CCPA compliance)
- Users can delete their entire account
- Organization data: user retains ownership of responses, org retains access per agreement
- Audio files can be deleted independently of text responses
- No response data is used for model training

### 12.5 Business Data Separation

- Business responses tagged with `organization_id`
- Organization-context responses are only queryable within org scope
- When a member departs, their business responses remain accessible per org policy
- Personal responses (if allowed) are never accessible to the organization
- Clear separation in the UI: "This response will be visible to your organization"

---

## 13. BUSINESS MODEL & MONETIZATION

### 13.1 Pricing Tiers

**Personal Plans:**

| Feature | Free | Standard ($7.99/mo) | Premium ($14.99/mo) |
|---------|------|---------------------|---------------------|
| Daily questions | 3/day | 5/day | 10/day |
| Question categories | 6 basic | All categories | All + custom |
| Response storage | 1 year | Unlimited | Unlimited |
| Voice responses | ✗ | ✓ | ✓ |
| Audio storage | — | 1 year | Unlimited |
| Wisdom queries received | 5/month | 50/month | Unlimited |
| Access grants | 2 people | 10 people | Unlimited |
| Legacy contacts | 1 | 3 | Unlimited |
| AI personality mode | ✗ | ✓ | ✓ |
| Data export | ✗ | ✓ | ✓ |
| Search & browse | Basic | Full | Full + AI insights |
| Priority support | ✗ | ✗ | ✓ |

**Business Plans:**

| Feature | Business ($19.99/seat/mo) | Enterprise (Custom) |
|---------|---------------------------|---------------------|
| Seats | Up to 50 | Unlimited |
| Role-specific frameworks | ✓ | ✓ + custom |
| Knowledge transfer tools | ✓ | ✓ |
| Admin dashboard | ✓ | ✓ |
| Analytics | Standard | Advanced |
| SSO/SAML | ✗ | ✓ |
| Data retention policy | 5 years | Custom |
| API access | ✗ | ✓ |
| Dedicated support | ✗ | ✓ |
| Custom integrations | ✗ | ✓ |
| On-premise option | ✗ | Available |

### 13.2 Revenue Projections (Conservative)

```
Year 1:
  Free users:        50,000
  Standard personal:  5,000 × $7.99  = $479,400/yr
  Premium personal:   1,000 × $14.99 = $179,880/yr
  Business seats:       500 × $19.99 = $119,940/yr
  Total ARR:                           $779,220

Year 2:
  Free users:        200,000
  Standard personal:  25,000 × $7.99  = $2,397,000/yr
  Premium personal:    5,000 × $14.99 = $899,400/yr
  Business seats:      3,000 × $19.99 = $719,640/yr
  Enterprise:         5 deals avg $50k = $250,000/yr
  Total ARR:                            $4,266,040

Year 3:
  Free users:        750,000
  Standard personal: 100,000 × $7.99  = $9,588,000/yr
  Premium personal:   25,000 × $14.99 = $4,497,000/yr
  Business seats:    15,000 × $19.99  = $3,597,000/yr
  Enterprise:       20 deals avg $75k  = $1,500,000/yr
  Total ARR:                            $19,182,000
```

### 13.3 Unit Economics

```
CAC (Customer Acquisition Cost):
  Personal: Target $15-25 (organic + content marketing)
  Business: Target $200-400 (sales + demos)

LTV (Lifetime Value):
  Free → Standard conversion: 10% within 6 months
  Standard churn: 5% monthly → avg lifetime 20 months
  Standard LTV: 20 × $7.99 = $159.80
  Premium LTV: 24 × $14.99 = $359.76
  Business LTV: 30 × $19.99 = $599.70

LTV:CAC Ratio Targets:
  Personal: 6:1 to 10:1
  Business: 3:1 to 5:1

Gross Margin Target: 75-80%
  Primary costs: AI API calls, storage, infrastructure
  AI cost per query: ~$0.02-0.05 (embedding + synthesis)
  Storage per user: ~$0.10-0.50/month
```

---

## 14. GROWTH STRATEGY

### 14.1 Phase 1: Foundation (Months 1-3)

**Goal:** Build core product, establish brand, seed initial user base.

**Product:**
- Launch web app (beta) for testing
- Build React Native mobile app in parallel
- Seed question bank: 500+ personal questions, 300+ business questions
- Core daily question flow + response capture
- Basic search and browse

**Marketing:**
- Launch landing page with waitlist
- SEO-optimized blog: "How to preserve family wisdom," "Knowledge management for executives"
- Create compelling demo video showing the personal use case (emotional, family-focused)
- Early influencer outreach: grief counselors, estate planners, legacy planning communities
- Submit to ProductHunt, HackerNews

**Users:**
- Target: 1,000 waitlist signups
- 200 beta testers (mix of personal and business)

### 14.2 Phase 2: Mobile Launch & Personal Growth (Months 4-6)

**Goal:** Launch mobile app, establish daily habit loop, grow personal user base.

**Product:**
- iOS and Android launch
- Push notifications (daily questions)
- Voice recording
- Streaks and milestones
- Basic wisdom query feature
- Access management (invite family members)

**Marketing:**
- App Store Optimization (ASO) — keywords: journal, legacy, wisdom, family, memories
- Content marketing: "5 Questions to Ask Your Parents Before It's Too Late" (viral potential)
- Partner with grief/bereavement organizations
- Partner with retirement communities and senior living
- Social media: Instagram and TikTok content about family wisdom
- Referral program: invite family = unlock premium features for a month

**Growth Levers:**
- **Viral loop:** When User A grants access to User B, User B must sign up → new user
- **Emotional content:** Stories about what people discover in loved ones' journals
- **Streaks:** Notification-driven daily engagement
- **Family pods:** Free tier allows 2 access grants → family members sign up

**Users:**
- Target: 10,000 total users
- 500 paying subscribers

### 14.3 Phase 3: Business Launch & Revenue (Months 7-12)

**Goal:** Launch business features, establish B2B revenue, refine AI capabilities.

**Product:**
- Organization management
- Role-specific question frameworks
- Knowledge transfer workflow
- Admin dashboard with analytics
- AI personality mode refinement
- Business-specific query features

**Marketing:**
- B2B content: "The True Cost of Executive Turnover" (whitepapers)
- LinkedIn thought leadership campaign
- Case studies from beta business users
- Partner with HR tech companies and consultants
- Attend HR/people ops conferences
- Cold outreach to companies with recent executive departures

**Growth Levers:**
- **Business → Personal crossover:** Business users sign up personally for family use
- **HR department buyers:** One buyer → many seats
- **Knowledge loss pain point:** Position as insurance against institutional knowledge drain
- **Integration partners:** Complement existing knowledge management tools

**Users:**
- Target: 50,000 total users
- 5,000 paying personal subscribers
- 500 business seats

### 14.4 Phase 4: Scale (Year 2)

**Goal:** Aggressive growth, platform expansion, market leadership.

**Product:**
- API for enterprise integrations
- Custom question frameworks (user-generated)
- Multi-language support
- Shared family journals (collaborative)
- Business intelligence: knowledge gap analysis
- Integration with Slack, Teams, Notion

**Marketing:**
- Paid acquisition (Facebook/Instagram for personal, LinkedIn for business)
- TV/podcast advertising targeting 35-65 demographic
- Partner with life insurance companies (legacy preservation add-on)
- Partner with estate planning attorneys
- International expansion (UK, Canada, Australia first)

**Growth Levers:**
- **Platform network effects:** More users → more people being invited → more users
- **Enterprise expansion:** Land and expand within organizations
- **Content library:** User stories and testimonials drive organic growth
- **SEO moat:** Thousands of indexed articles on wisdom, legacy, knowledge transfer

### 14.5 Key Metrics to Track

**Engagement:**
- DAU/MAU ratio (target: >40%)
- Daily question completion rate (target: >60%)
- Average response length over time (should increase)
- Streak retention (% of users with 7+ day streaks)
- Voice vs text response ratio

**Retention:**
- Day 1, Day 7, Day 30 retention
- Monthly cohort retention curves
- Streak-correlated retention
- Time to first "meaningful" response (>100 words)

**Monetization:**
- Free to paid conversion rate
- MRR growth rate
- Churn rate by tier
- ARPU (average revenue per user)
- Business seat expansion rate

**Wisdom Quality:**
- Query satisfaction rating (1-5)
- Source citation relevance scores
- AI confidence score distribution
- Repeat query rate (people coming back to ask more)

---

## 15. DEVELOPMENT ROADMAP

### 15.1 Sprint Plan

**Sprint 1-2 (Weeks 1-4): Foundation**
- [ ] Project setup: monorepo, CI/CD, deployment
- [ ] Database: Create all tables, indexes, triggers
- [ ] Auth: Registration, login, JWT, refresh tokens
- [ ] User CRUD endpoints
- [ ] Seed data: question categories, 100 personal questions

**Sprint 3-4 (Weeks 5-8): Core Question Flow**
- [ ] Question engine: daily question selection algorithm
- [ ] Daily question set generation and persistence
- [ ] Response submission API (text only)
- [ ] Response storage with word count computation
- [ ] Basic embedding generation (background job)
- [ ] React web app: login, today's questions, response input

**Sprint 5-6 (Weeks 9-12): Mobile App Shell**
- [ ] React Native project setup with Expo
- [ ] Auth flow (login, register, onboarding)
- [ ] Today screen with daily questions
- [ ] Response input screen
- [ ] Basic journal browser
- [ ] Push notification setup (Expo Notifications + Supabase)
- [ ] Daily notification scheduling

**Sprint 7-8 (Weeks 13-16): Voice & Search**
- [ ] Voice recording in React Native
- [ ] Audio upload to Supabase Storage
- [ ] Whisper/Deepgram transcription integration
- [ ] Voice response flow (record → transcribe → review → save)
- [ ] Semantic search: vector search across responses
- [ ] Basic wisdom query endpoint

**Sprint 9-10 (Weeks 17-20): Wisdom Query & Access**
- [ ] Full wisdom query pipeline (embed → search → re-rank → synthesize)
- [ ] Voice style profile generation
- [ ] Personality mode vs neutral mode
- [ ] Access grant system (invite by email)
- [ ] Access management UI
- [ ] Legacy contact setup

**Sprint 11-12 (Weeks 21-24): Polish & Business**
- [ ] Streaks, milestones, celebrations
- [ ] Question feedback system
- [ ] AI follow-up question generation
- [ ] Organization creation and member management
- [ ] Business question frameworks (CFO, CTO, etc.)
- [ ] Knowledge transfer workflow
- [ ] Analytics dashboard

**Sprint 13-14 (Weeks 25-28): Launch Prep**
- [ ] App Store submission (iOS + Android)
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit
- [ ] Privacy policy, terms of service
- [ ] Landing page and waitlist → launch conversion
- [ ] Stripe integration (subscriptions)
- [ ] Launch!

---

## 16. FILE & FOLDER STRUCTURE

### 16.1 Monorepo Structure

```
wisdom-journal/
├── apps/
│   ├── mobile/                    # React Native (Expo) app
│   │   ├── app/                   # Expo Router screens
│   │   ├── components/            # UI components
│   │   ├── hooks/                 # Custom hooks
│   │   ├── services/              # API clients
│   │   ├── store/                 # Zustand stores
│   │   ├── theme/                 # Design tokens
│   │   ├── utils/                 # Helpers
│   │   ├── assets/                # Images, fonts, animations
│   │   ├── app.json
│   │   ├── eas.json
│   │   └── package.json
│   │
│   ├── web/                       # Next.js web app
│   │   ├── app/                   # App router pages
│   │   ├── components/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── admin/                     # Admin dashboard (Next.js)
│       ├── app/
│       ├── components/
│       └── package.json
│
├── packages/
│   ├── api/                       # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/            # Route handlers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── questions.ts
│   │   │   │   ├── responses.ts
│   │   │   │   ├── wisdom.ts
│   │   │   │   ├── access.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── admin.ts
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── questionEngine.ts
│   │   │   │   ├── embeddingService.ts
│   │   │   │   ├── wisdomQueryService.ts
│   │   │   │   ├── voiceStyleService.ts
│   │   │   │   ├── notificationService.ts
│   │   │   │   ├── audioService.ts
│   │   │   │   └── streakService.ts
│   │   │   ├── jobs/              # Background job processors
│   │   │   │   ├── generateEmbeddings.ts
│   │   │   │   ├── generateDailyQuestions.ts
│   │   │   │   ├── sendNotifications.ts
│   │   │   │   ├── analyzeVoiceStyle.ts
│   │   │   │   ├── generateFollowUps.ts
│   │   │   │   └── processAudioTranscription.ts
│   │   │   ├── middleware/        # Auth, rate limiting, validation
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── errorHandler.ts
│   │   │   ├── db/                # Database layer
│   │   │   │   ├── client.ts      # PostgreSQL connection
│   │   │   │   ├── redis.ts       # Redis connection
│   │   │   │   └── queries/       # Prepared queries
│   │   │   ├── lib/               # Shared utilities
│   │   │   │   ├── ai.ts          # Anthropic/OpenAI clients
│   │   │   │   ├── supabase.ts    # Supabase client (DB, storage, auth)
│   │   │   │   ├── stripe.ts      # Stripe client
│   │   │   │   └── notifications.ts # Expo push notification client
│   │   │   └── index.ts           # App entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                  # Database migrations & seeds
│   │   ├── migrations/
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_organizations.sql
│   │   │   ├── 003_create_questions.sql
│   │   │   ├── 004_create_responses.sql
│   │   │   ├── 005_create_embeddings.sql
│   │   │   ├── 006_create_access_grants.sql
│   │   │   ├── 007_create_notifications.sql
│   │   │   ├── 008_create_analytics.sql
│   │   │   └── 009_create_triggers.sql
│   │   ├── seeds/
│   │   │   ├── categories.sql
│   │   │   ├── frameworks.sql
│   │   │   ├── personal_questions.sql
│   │   │   └── business_questions.sql
│   │   └── package.json
│   │
│   └── shared/                    # Shared TypeScript types & utilities
│       ├── src/
│       │   ├── types/             # Shared type definitions
│       │   │   ├── user.ts
│       │   │   ├── question.ts
│       │   │   ├── response.ts
│       │   │   ├── wisdom.ts
│       │   │   ├── organization.ts
│       │   │   └── api.ts
│       │   ├── constants/
│       │   │   ├── categories.ts
│       │   │   └── config.ts
│       │   └── validators/        # Zod schemas
│       │       ├── auth.ts
│       │       ├── response.ts
│       │       └── query.ts
│       └── package.json
│
├── infrastructure/
│   ├── supabase/
│   │   ├── config.toml            # Supabase project config
│   │   ├── seed.sql               # Seed data
│   │   └── storage-policies.sql   # Storage bucket RLS policies
│   └── vercel/
│       ├── vercel.json            # Vercel project config
│       └── env.example            # Environment variable template
│
├── docs/
│   ├── API.md                     # API documentation
│   ├── ARCHITECTURE.md            # Architecture decisions
│   ├── QUESTION_ENGINE.md         # Question selection deep dive
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── CONTRIBUTING.md
│
├── scripts/
│   ├── seed-questions.ts          # Import seed questions
│   ├── generate-embeddings.ts     # Batch embedding generation
│   └── migrate.ts                 # Database migration runner
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── deploy-api.yml         # Vercel API deployment
│       ├── deploy-web.yml         # Vercel web deployment
│       └── deploy-mobile.yml      # EAS Build + Submit
│
├── package.json                   # Monorepo root (turborepo/nx)
├── turbo.json                     # Turborepo config
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

---

## APPENDIX A: SEED QUESTION EXAMPLES

### Personal Questions (Sample of 50)

**Values & Beliefs:**
1. What's a value you hold that most people around you don't share?
2. If you could instill one quality in every person you love, what would it be?
3. What do you believe about forgiveness that you've learned the hard way?
4. What does "success" mean to you right now, and how has that definition changed?
5. What principle guides you when you have to make a really tough choice?

**Life Stories:**
6. What's a moment from your childhood that nobody else would remember, but you'll never forget?
7. Tell me about a time you were completely wrong about something important.
8. What's the most unexpected way a stranger has changed your life?
9. Describe a place from your past that felt like home. What made it feel that way?
10. What's a story your family tells about you that you'd want recorded for future generations?

**Career & Work:**
11. What's the most important lesson you learned in your very first job?
12. Tell me about a mentor who shaped your professional life. What did they teach you?
13. What's a professional failure that turned into something unexpectedly good?
14. If you could give one piece of career advice to a 22-year-old today, what would it be?
15. What work accomplishment are you most proud of, and why?

**Relationships:**
16. What's the most important thing you've learned about being a good partner?
17. How has your understanding of love changed over the years?
18. Tell me about a friendship that surprised you with its depth.
19. What's the hardest conversation you've ever had with someone you love?
20. What do you wish you'd understood about relationships when you were younger?

**Wisdom & Advice:**
21. What's something you wish someone had told you at 25?
22. What's the best piece of advice you've ever received? Did you follow it?
23. If you had to write a one-page letter to your grandchildren, what would you say?
24. What's a common piece of advice you think is actually wrong?
25. What do you know now that you wish you'd known 10 years ago?

**Daily Life:**
26. What's your morning routine, and why has it evolved to what it is?
27. What's a small daily pleasure that makes your life better?
28. How do you recharge when you're emotionally drained?
29. What's your go-to comfort meal, and what memories does it bring up?
30. Describe your perfect lazy weekend.

**Challenges & Growth:**
31. What's the hardest thing you've ever done?
32. Tell me about a time you had to start over. How did you handle it?
33. What's a fear you've overcome? How did you do it?
34. When was the last time you fundamentally changed your mind about something?
35. What challenge are you proud of how you handled?

**Hopes & Dreams:**
36. What's still on your bucket list?
37. What do you hope the world looks like in 50 years?
38. If money were no object, how would you spend your days?
39. What legacy do you want to leave behind?
40. What's something you've always wanted to learn but haven't yet?

**Humor & Joy:**
41. What's the funniest thing that's ever happened to you?
42. What makes you laugh harder than anything else?
43. What's a guilty pleasure you're willing to admit?
44. Tell me about the most ridiculous adventure you've been on.
45. What's the weirdest talent or skill you have?

**Hypotheticals:**
46. If you could live in any time period, when and why?
47. If you could have dinner with three people, alive or dead, who would you choose?
48. If you could master any skill instantly, what would it be?
49. If you could relive one year of your life, which one and why?
50. If your house was on fire and everyone was safe, what one item would you grab?

### Business Questions (Sample of 30)

**Decision Framework:**
1. Walk me through the biggest financial decision you've made this year. What was your process?
2. How do you decide between two good options when neither is clearly better?
3. What data do you look at first when evaluating a new opportunity?
4. When do you trust your gut over the numbers? Give me an example.
5. How do you handle disagreements with the board or other executives?

**Stakeholder Management:**
6. Who are our top 5 most important external relationships and why?
7. How do you prepare for a difficult conversation with a board member?
8. What's the most delicate stakeholder situation you've navigated here?
9. How do you manage expectations when you know you'll miss a target?
10. What does each board member care most about?

**Process & Workflow:**
11. Walk me through your quarterly planning process step by step.
12. How do you structure your week to stay on top of everything?
13. What reports do you review weekly, and what are you looking for?
14. What's a process you've improved that used to be broken?
15. How do you prioritize competing demands on your time?

**Institutional Knowledge:**
16. What's something about this company that isn't written down anywhere but everyone should know?
17. What unwritten rules govern how things actually get done here?
18. Who are the go-to people for problems that don't fit neatly into an org chart?
19. What historical decision still affects how we operate today?
20. What's the cultural "third rail" — the thing nobody talks about but everyone knows?

**Risk Assessment:**
21. What are the top 3 risks to this business that keep you up at night?
22. How do you monitor for early warning signs of problems?
23. What's a risk we're currently accepting that we probably shouldn't be?
24. Tell me about a time a risk materialized. How did you respond?
25. What's our contingency plan if we lose our biggest client/partner?

**Strategic Thinking:**
26. Where do you see this department in 3 years?
27. What's the biggest competitive threat we're not paying enough attention to?
28. If you had an extra $1M in budget, where would you invest it?
29. What's the most important metric for this department and why?
30. What would you do differently if you were starting this role from scratch?

---

## APPENDIX B: ENVIRONMENT VARIABLES

```env
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.wisdomjournal.com
WEB_URL=https://wisdomjournal.com

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=<secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI Services
ANTHROPIC_API_KEY=<key>
OPENAI_API_KEY=<key>

# Audio Transcription
DEEPGRAM_API_KEY=<key>

# Storage
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
SUPABASE_STORAGE_BUCKET=wisdom-journal-audio

# Push Notifications (Expo)
EXPO_ACCESS_TOKEN=<token>

# Payments
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<key>
STRIPE_PRICE_STANDARD=price_xxxxx
STRIPE_PRICE_PREMIUM=price_xxxxx
STRIPE_PRICE_BUSINESS=price_xxxxx

# Monitoring
SENTRY_DSN=<dsn>

# Email
SENDGRID_API_KEY=<key>
EMAIL_FROM=hello@wisdomjournal.com
```

---

*This document is the complete specification for Wisdom Journal. Hand this to Claude Code to begin building.*
