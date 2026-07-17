# Wisdom Journal — Beta Launch Checklist

Last updated: July 16, 2026. The app is code-complete for the test-user
phase: build passes, every core flow was verified end-to-end in a browser,
and the database migrations (through 038) are applied to the live Supabase
project.

## 1. Deploy to Vercel (~15 minutes)

1. Push this repo to GitHub (if not already) and import it in Vercel.
2. Framework preset: **Next.js**. Root directory: `apps/web`.
   (Vercel detects the Turborepo automatically; if asked, build command
   `cd ../.. && npx turbo build --filter=@wisdom-journal/web` or accept the default.)
3. Set the environment variables (Production + Preview):

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
   | `SUPABASE_SERVICE_ROLE_KEY` | same page (keep secret) |
   | `OPENROUTER_API_KEY` | openrouter.ai → Keys |
   | `NEXT_PUBLIC_SITE_URL` | your production URL, e.g. `https://wisdomjournal.app` |
   | `NEXT_PUBLIC_APP_URL` | same as above (used in email links) |
   | `RESEND_API_KEY` | resend.com → API Keys (email notifications) |
   | `RESEND_FROM_EMAIL` | a verified sender, e.g. `Wisdom Journal <hello@yourdomain>` |
   | `CRON_SECRET` | any long random string — protects the reminder cron |

4. `apps/web/vercel.json` already schedules the daily-reminder cron
   (14:00 UTC). Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
5. Deploy, then open the production URL and click through
   register → onboarding → answer → journal → ask.

## 2. Supabase production settings (~10 minutes)

- **Auth → URL Configuration**: set Site URL to the production domain and
  add `https://<domain>/auth/callback` to Redirect URLs (keep the
  localhost entry for development).
- **Auth → Providers → Google**: add the production domain to the Google
  OAuth client's authorized origins/redirects.
- **Auth → Passwords**: enable *leaked password protection* (flagged by
  the Supabase security advisor).
- **Auth → SMTP**: the built-in mailer is rate-limited (~4 emails/hour) —
  fine for the first few testers, but connect custom SMTP (Resend works)
  before inviting a bigger wave, or signup confirmations will silently
  throttle.

## 3. Inviting test users

- Beta gate is live: registration requires an invite code.
- Existing code: `WISDOM-BETA-2026` (15 uses). Create more (per-friend
  codes make attribution easy) at **/admin → Beta Invite Codes**.
- Suggested invite message:
  > I'm building Wisdom Journal — it asks you one thoughtful question a
  > day and builds a private archive your loved ones can ask questions
  > of, forever. I'd love your honest feedback. Sign up at <URL> with
  > invite code WISDOM-BETA-2026. The Feedback button (bottom-right) goes
  > straight to me.
- Feedback loop: testers use the in-app **Feedback** button → review at
  **/admin → Beta Feedback** (mark New → Reviewed → Resolved).
- Watch adoption at /admin: users, responses, active-in-7-days, streaks.

## 4. What was fixed/added in this pass (July 16, 2026)

- **RLS recursion (critical):** group policies recursed and 500'd every
  profile fetch for logged-in users — rewritten with SECURITY DEFINER
  helpers (migration 034).
- **Semantic search was never working:** `response_embeddings` RLS had no
  INSERT policy (table was empty forever) and the vector RPC's
  search_path lost the pgvector operator. Fixed (037, 038 + service-role
  writes), all 32 existing responses backfilled with embeddings.
- **Activity feed for solo users:** events now write on every response
  (personal + per-group) with correct category data, plus friend-added
  events; existing responses backfilled (035).
- **People extraction:** LLM's ```json fences broke parsing — now
  tolerant; verified mentions extract with relationships.
- **Fonts never loaded** (invalid CSS `@import` position). Migrated to
  `next/font` with a new identity: Fraunces (headings) + DM Sans (body).
- **Timezone bugs:** journal grouping and calendar strip used UTC dates —
  evening entries filed under "tomorrow." All local now; the calendar
  strip also actually filters by day (toggle to clear).
- **New:** /privacy + /terms, feedback widget + admin triage, favicon +
  social-share OG image, grouped sidebar, fully clickable question cards,
  mobile stat-card layout, pluralization cleanup, GSAP fixes (blank
  streak card, cross-component animation kills).

## 5. Known deferred items (fine for beta)

- Stripe/payments (pricing page is display-only; beta is free).
- Native mobile app (spec section 8) — the web app is responsive.
- Voice *audio storage* (voice input transcribes to text; audio isn't kept).
- `.claude/worktrees/crazy-goldstine` is a leftover session worktree —
  delete whenever (`git worktree remove` or delete the folder).

## Test account (local/dev)

- `beta.tester@wisdomjournal.test` / `WisdomTest!2026`
  (created via admin API, email pre-confirmed; used one slot of
  WISDOM-BETA-2026 — feel free to delete the user in /admin.)
