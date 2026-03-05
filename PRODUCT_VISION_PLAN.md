# Wisdom Journal — Product Vision & Architecture Plan (v2)

> Updated based on founder feedback. This replaces the original two-mode (Personal/Business) model with a **unified Groups-based architecture**.

---

## Core Concept

Every user has **one account** and **one personal encyclopedia**. Your encyclopedia is the collection of all your journal responses, organized into categories and subcategories. You build it by answering daily questions.

The magic happens through **Groups**. Groups are how you share, connect, and query. There is no separate "business mode" — a business is just a group with an admin, billing, and role-based access. A family is also a group. A friend circle is a group. A public figure's followers are a group.

**One account. One encyclopedia. Many groups.**

---

## The Encyclopedia

### Structure: Categories → Subcategories
Every journal response is tagged to a **category** and **subcategory**. Categories are fixed (same for everyone). Subcategories provide depth.

| Category | Subcategories |
|---|---|
| **Medical & Health** | Family history, Conditions & diagnoses, Medications & treatments, Allergies, Mental health, Fitness & wellness |
| **Financial** | Investment philosophy, Lessons learned, Estate & planning, Business finances, Budgeting wisdom |
| **Relationships** | Marriage & partnership, Parenting, Friendships, Dating advice, Conflict resolution, Loss & grief |
| **Deeply Personal** | Regrets, Private struggles, Inner reflections, Fears, Dreams & aspirations |
| **Life Lessons** | Mistakes & growth, Pivotal moments, Things I wish I knew, Advice to younger self |
| **Family & Traditions** | Recipes, Holiday traditions, Cultural heritage, Family stories, Genealogy |
| **Career & Work** | Industry knowledge, Leadership, Decision-making, Processes & playbooks, Mentorship |
| **Hobbies & Interests** | Skills & how-tos, Collections, Travel, Creative pursuits, Sports |
| **Values & Beliefs** | Philosophy, Spirituality, Moral framework, Political views, Ethics |
| **Memories & Stories** | Childhood, Travel stories, Funny moments, Milestone events, People I've met |

### How Entries Get Categorized
- Daily questions are pre-tagged with a primary category
- The AI also auto-suggests category/subcategory based on response content
- User can override or add additional tags
- A single response can belong to multiple categories

### Encyclopedia Size Awareness
- Small encyclopedia = fewer categories populated, simpler structure
- Large encyclopedia = rich subcategory depth, more queryable surface area
- The UI adapts: small encyclopedias show a clean simple view; large ones reveal the full tree

---

## Access Control: Per-Person Category Toggles

When you grant someone access to your encyclopedia, you don't assign them a "tier" — you **toggle individual categories on/off** for that specific person.

### How It Works
- You invite someone (or accept their request)
- You see a list of ALL your encyclopedia categories
- Each category has a **toggle switch** (on/off) for that person
- You can also set a **trust color** (red → yellow → green) as a visual shorthand, but the toggles are what actually control access

### Trust Color (Visual Shorthand)
The trust color is a quick-glance indicator, NOT a permission system:
- **Green**: This person has access to most/all of my categories
- **Yellow**: Partial access — some categories
- **Red**: Minimal access — very limited categories
- The color auto-calculates based on how many toggles are on (percentage-based)
- Or the user can manually set it as a personal label

### Example
> Cole grants access to his grandmother:
> - Medical & Health: ON
> - Financial: OFF
> - Relationships: ON
> - Deeply Personal: OFF
> - Life Lessons: ON
> - Family & Traditions: ON
> - Career & Work: OFF
> - Hobbies & Interests: ON
> - Values & Beliefs: ON
> - Memories & Stories: ON
>
> Trust color auto-calculates to **Green** (7/10 on)

> Cole grants access to a work acquaintance:
> - Career & Work: ON
> - Life Lessons: ON
> - Everything else: OFF
>
> Trust color: **Red** (2/10 on)

---

## Groups

Groups are the social layer of Wisdom Journal. They replace the old "Personal vs Business" split. Everything is groups.

### What Is a Group?
A group is a collection of people who share access to each other's encyclopedias (or parts of them) under a common purpose.

### Group Types

| Type | Created By | Example | Key Feature |
|---|---|---|---|
| **Private Group** | Any user | "Close Family", "College Friends" | Invite-only, creator is admin |
| **Organization** | Business admin | "Acme Corp Engineering" | Admin controls access, billing, roles |
| **Public Group** | Any user | "Stoicism with Marcus" (public figure) | Anyone can join, creator controls which categories are exposed |

### Group Structure
- **Group Admin/Owner**: Creates the group, controls settings, manages members
- **Members**: People in the group, each with their own per-person category toggles
- **Group-level defaults**: Admin can set default category access for new members (but individual overrides always win)

### How Groups Work

**Private Group ("My Family")**
1. Cole creates group "My Family"
2. Invites mom, dad, sister, grandma
3. Each member's encyclopedia becomes queryable by other members — BUT only the categories they've toggled on for the group
4. Cole can ask: "What was grandpa's recipe for his famous chili?" → queries grandma's encyclopedia (Family & Traditions: ON)
5. Each member controls their own toggles independently

**Organization ("Acme Corp")**
1. Company admin creates org group
2. Invites employees, assigns roles (admin, department head, member)
3. Admin can set default category access per role
4. Employees answer work-related daily questions → builds organizational knowledge
5. Any member can query the collective knowledge within their access level
6. The org pays for member seats (members get individual accounts included)

**Public Group ("Philosophy with Marcus")**
1. Public figure creates group, marks it "Public"
2. Sets which categories are exposed (e.g., Values & Beliefs, Life Lessons only)
3. Anyone can join and query those categories
4. Creator keeps answering questions, growing the queryable encyclopedia
5. Niche wisdom communities form around specific knowledge domains

### Group Queries
When you're in a group context and ask a question:
- The AI searches across ALL group members' encyclopedias (within your permitted categories)
- Results attribute which member's knowledge the answer came from
- You can also target a specific person: "What did grandpa think about..." vs "What does the family think about..."

### People Can Be In Multiple Groups
- One person can be in "Family", "Work Friends", "Public Philosophy Group"
- Their toggles are **per-group** — different categories shared with different groups
- One account, one encyclopedia, many group contexts

---

## The Knowledge Web Visualization

Each user and each group has a visual **web** — a radial graph that shows the knowledge structure.

### Personal Web
- Your profile picture in the center
- Categories radiate outward as nodes
- Subcategories branch off each category
- Node size = how much content is in that area
- Connections between related entries create cross-links
- Animated, interactive — you can explore your own knowledge visually

### Group Web
- Group icon in the center
- Members radiate outward with their profile pictures
- Lines connect members to the categories they've shared with the group
- You can see the overall knowledge coverage of the group
- Accessible nodes are lit up, locked ones are dimmed
- NOT a pyramid/hierarchy — it webs out radially from center

### Stats & Achievements
The web visualization also drives engagement stats:
- **People mentioned**: "You referenced 175 unique people this year"
- **Knowledge depth**: "Your Career & Work category has 342 entries"
- **Social connections**: "You're in 5 groups with 47 people"
- **Consistency**: "89-day journal streak"
- **Re-mentions**: "You mentioned your grandfather in 23 entries across 4 categories"
- **Growth**: "Your encyclopedia grew 40% this quarter"

These stats are **shareable** — users can share achievement cards to social media or within groups. Gamification without being annoying.

---

## Billing & Accounts

### The Account Problem
A person should only have ONE account. But a business might want to pay for their employees' accounts.

### Solution: Account + Seat Billing

**Individual Account (Free / Standard / Premium)**
- User pays for their own tier
- Tier determines: daily question limit, voice/video capture, encyclopedia size, AI query limits, number of groups

**Organization Seats**
- When a business creates an org group, they purchase **seats**
- A seat = an individual account upgraded to a certain tier, paid for by the org
- If the employee already has a personal account, the org seat upgrades it (or the employee keeps whichever tier is higher)
- When the employee leaves the org, they keep their personal account but lose the org-paid upgrade
- The org retains access to work-related encyclopedia entries contributed during employment (those entries were tagged to org categories)

### What the Org Owns vs What the Individual Owns
- **Individual owns**: Their personal encyclopedia, personal groups, personal entries
- **Org owns**: Entries contributed within the org context (work questions, org-tagged categories)
- **Separation**: Org-context entries and personal entries are separate — the org can't see your personal "Deeply Personal" entries just because they pay for your seat
- **On departure**: Individual keeps personal stuff, org keeps org-context knowledge, employee can't delete org entries

---

## AI Architecture

### Model Selection Strategy (OpenRouter)
Use **OpenRouter** as the routing layer. Choose models dynamically based on query complexity and encyclopedia size.

### Routing Logic

| Scenario | Model Tier | Why |
|---|---|---|
| Small encyclopedia, simple question | Small/fast model (Haiku-class) | Low context needed, fast response, cheap |
| Small encyclopedia, complex question | Medium model (Sonnet-class) | Need reasoning but low context |
| Large encyclopedia, simple lookup | Medium model + RAG | Retrieve relevant chunks, don't need huge context |
| Large encyclopedia, complex synthesis | Large model (Opus-class) | Need to synthesize across many entries |
| Group query (multiple people) | Medium/Large + RAG | Aggregate from multiple encyclopedias |
| Business org query (large knowledge base) | Large model + RAG | Big context, complex cross-referencing |

### RAG Pipeline
For any encyclopedia beyond trivial size:
1. **Embed** all journal entries on creation (vector embeddings)
2. **Retrieve** relevant chunks based on query (semantic search)
3. **Filter** chunks by access control (only categories the seeker has access to)
4. **Prompt** the model with retrieved context + query
5. **Attribute** which entries/people the answer drew from

This means we almost never send the full encyclopedia as context. We retrieve the top-K relevant chunks, which keeps context small and costs down regardless of encyclopedia size.

### Cost Control
- Free tier: limited queries/day, smallest models only
- Standard: more queries, medium models
- Premium: unlimited queries, access to larger models for complex synthesis
- Org billing: model tier scales with seat count and usage

### Model-Agnostic via OpenRouter
- OpenRouter lets us switch models without code changes
- We can A/B test different models per scenario
- As cheaper/better models launch, we route to them automatically
- Fallback chains: if primary model is down, fall back to alternative

---

## Daily Questions: Anti-Burnout Design

### Principles
- **Never overwhelming**: 1 question per day by default
- **Flexible**: User can answer more if they want (pull more from the queue)
- **Skippable**: No guilt — skip days without losing streaks immediately (grace period)
- **Contextual**: Questions get smarter over time — they know what you've already covered
- **Seasonal**: Questions adapt to time of year, life events, recent answers
- **Category-balanced**: Rotates through categories so no area gets neglected

### Question Depth Progression
- **Week 1-2**: Easy, warm-up questions ("What's your favorite childhood memory?")
- **Month 1-3**: Medium depth ("What's the hardest decision you've ever made?")
- **Month 3+**: Deep questions ("What do you wish you could tell your younger self about failure?")
- User can adjust depth preference in settings

### Engagement Without Burnout
- Gentle push notifications (not aggressive)
- Streak system with grace days (miss 1 day, streak continues)
- Weekly digest: "Here's what you captured this week"
- Milestone celebrations: "You've answered 100 questions!"
- No punishment for breaks — the app welcomes you back warmly

---

## Lifetime Stats & Analytics

### Personal Dashboard
- Encyclopedia size & growth over time
- Category coverage radar chart
- People mentioned frequency
- Mood/sentiment trends across entries
- Streak history
- "On this day" — past entries from same date

### Group Dashboard
- Collective knowledge coverage
- Most active contributors
- Knowledge gaps (categories with low coverage)
- Query trends (what are people asking about most?)
- Member engagement stats

### Org Admin Dashboard
- All group stats plus:
- Per-department knowledge health
- Onboarding effectiveness (how quickly new hires query)
- Knowledge retention metrics (when someone leaves, what % was captured)
- ROI metrics: queries answered that would have been meetings

### Shareable Achievement Cards
- Visually appealing cards users can share to social media
- "I've captured 365 days of wisdom" with a beautiful graphic
- "My family's collective knowledge spans 12 categories"
- Web visualization snapshots

---

## Open Questions (Remaining)

1. **Posthumous controls**: How does a user designate a "digital executor" who manages their encyclopedia after passing? UI for setting this up?

2. **Group query attribution**: When AI answers from a group, do you always see who the knowledge came from? Or can members opt for anonymous contribution?

3. **Public group monetization**: Can a public figure charge for access to their public group? (Potential upsell/creator economy angle)

4. **Category customization**: Can orgs define custom categories beyond the standard set? (e.g., "Client Playbooks" as a custom category)

5. **Data export**: What format? PDF of your encyclopedia? JSON export? Can you migrate to another service?

6. **Offline/voice-first**: How important is a mobile-first voice capture experience? Should this be a separate mobile app or PWA?

7. **Notification strategy**: Push vs email vs in-app? Per-group notification settings?

8. **Content moderation for public groups**: If someone's public group has harmful content, how do we handle it?

---

## Technical Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Turborepo monorepo |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Database | Supabase (Postgres) | RLS for access control |
| Vector Store | Supabase pgvector (or Pinecone) | For RAG embeddings |
| AI Routing | OpenRouter | Dynamic model selection |
| Embeddings | OpenAI text-embedding-3-small (via OpenRouter) | For journal entry embeddings |
| Sky/Astronomy | SunCalc + NASA API + Geolocation | Realistic sky rendering |
| Payments | Stripe | Individual + org seat billing |
| Hosting | Vercel | Auto-deploy from GitHub |
| Shared Types | @wisdom-journal/shared | Turborepo package |
