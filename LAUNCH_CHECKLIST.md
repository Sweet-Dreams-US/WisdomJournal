# Wisdom Journal — Beta Launch Checklist

Last updated: July 16, 2026 (evening). **The app is deployed**: pushing to
`main` on GitHub auto-deploys to Vercel. Database migrations through 041
are applied to the live Supabase project.

## 1. Deployment — DONE ✓

- Production: **https://wisdom-journal.vercel.app**
- Vercel project `wisdom-journal` (team *Sweet Dreams' projects*), root
  directory `apps/web`, linked to github.com/colemarcuccilli/WisdomJournal
  — every push to `main` deploys automatically.
- All env vars are set in Vercel (Supabase keys, `OPENROUTER_API_KEY`,
  `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_APP_URL`). If you buy a custom domain, update the two
  `NEXT_PUBLIC_*_URL` vars.
- `apps/web/vercel.json` schedules the daily-reminder cron (14:00 UTC).
- `RESEND_FROM_EMAIL` is unset — emails fall back to
  `noreply@wisdomjournal.app`, which only delivers if that domain is
  verified in Resend. Set it to a verified sender before relying on
  email notifications.

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

## 2.5 Business tier (live as of July 16, evening)

- **Marketing**: https://wisdom-journal.vercel.app/business (linked from
  navbar + footer). Pricing shown: $19.99/seat Business, custom
  Enterprise — labeled *free during beta*.
- **In-app**: Organizations (sidebar → Connect). Any user can create an
  org (10 seats default), add departments, invite by email (owner/admin/
  member roles + job titles), and manage members. Invitees get an email
  with a join link (or share the /org/join/TOKEN link directly).
- **Daily mixing**: active org members automatically get 2 business
  questions (from a 120-question bank across 6 business categories) + 2
  personal + 1 reflection. Toggle in Profile → "Work questions".
- **Privacy model** (marketed as a feature): business answers are tagged
  to the org, but admins see participation/coverage METRICS only — no
  one can read anyone else's entries. Knowledge-transfer access (e.g.
  successor grants when someone departs) is the next business feature.
- **Mixing/matching**: personal + business coexist per user; personal
  entries never touch the org; business categories stay out of personal
  pickers.

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

## 5. Path to the app stores

The app is now an installable **PWA** — on a phone, "Add to Home Screen"
gives a standalone app with the Wisdom icon today. For real store
listings:

- **Google Play**: wrap the PWA as a Trusted Web Activity (TWA) with
  [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or
  pwabuilder.com — a few hours of work, needs a Play developer account
  ($25 one-time) and a `assetlinks.json` file served from the domain.
- **Apple App Store**: wrap with [Capacitor](https://capacitorjs.com)
  (WebView shell around the deployed site, plus native plugins later for
  push notifications/microphone) — needs an Apple Developer account
  ($99/yr) and Xcode. Apple rejects thin wrappers with no native value,
  so plan to add native push + haptics + share-sheet in the wrapper.
- Both wrappers point at the SAME deployed web app, so web and store
  versions stay identical automatically — exactly the "either or can be
  used" goal.

## 6. Known deferred items (fine for beta)

- Stripe/payments (pricing page is display-only; beta is free).
- Voice *audio storage* (voice input transcribes to text; audio isn't kept).
- Google OAuth production redirect config (you're handling this).
- `.claude/worktrees/crazy-goldstine` is a leftover session worktree —
  delete whenever (`git worktree remove` or delete the folder).

## Test account (local/dev)

- `beta.tester@wisdomjournal.test` / `WisdomTest!2026`
  (created via admin API, email pre-confirmed; used one slot of
  WISDOM-BETA-2026 — feel free to delete the user in /admin.)
