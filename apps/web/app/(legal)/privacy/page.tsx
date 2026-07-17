import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Wisdom Journal collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "July 16, 2026";

export default function PrivacyPage() {
  return (
    <article className="prose-wisdom">
      <h1 className="text-3xl text-twilight mb-2">Privacy Policy</h1>
      <p className="text-sm text-charcoal/50 mb-10">
        Effective {EFFECTIVE_DATE} · Wisdom Journal is operated by Sweet Dreams
        Music LLC (&quot;we,&quot; &quot;us&quot;).
      </p>

      <div className="space-y-8 text-[15px] leading-relaxed text-charcoal/80">
        <section>
          <h2 className="text-xl text-twilight mb-3">The short version</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your journal is yours. You choose who can see any of it.</li>
            <li>
              We never sell your data, and your journal entries are never used
              to train AI models.
            </li>
            <li>
              AI features only read your entries at the moment you (or someone
              you&apos;ve authorized) use them.
            </li>
            <li>You can export or permanently delete everything, any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Account information</strong> — your name, email address,
              and password (stored as a secure hash by our authentication
              provider, Supabase). If you sign in with Google, we receive your
              name and email from Google.
            </li>
            <li>
              <strong>Journal content</strong> — the questions you&apos;re
              asked and the responses you write or dictate. Voice input is
              transcribed to text; we store the text.
            </li>
            <li>
              <strong>Usage basics</strong> — streaks, word counts, and which
              features you use, so the app can show your progress.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">How your content is used</h2>
          <p className="mb-3">
            Your responses are stored verbatim — we never rewrite or summarize
            them at capture time. They are used only to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Show you your own journal, encyclopedia, and stats.</li>
            <li>
              Power AI features you invoke — insights, search, and
              &quot;Ask&quot; queries. When you use these, relevant entries are
              sent to our AI processors (OpenRouter, which routes to providers
              such as Anthropic and OpenAI) to generate the answer. These
              providers process the text to serve your request and do not use
              it to train their models.
            </li>
            <li>
              Share with people <em>you</em> explicitly authorize — friends,
              groups, share links, access grants, or legacy contacts. Sharing
              is opt-in, per person, and revocable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Cookies</h2>
          <p>
            We use only the cookies required to keep you signed in
            (authentication session cookies). No advertising or cross-site
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Where your data lives</h2>
          <p>
            Data is stored in our Supabase-hosted PostgreSQL database in the
            United States, encrypted at rest and in transit (TLS). Access is
            protected by row-level security so each account can only read what
            it is entitled to.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Your rights</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Export</strong> — download all of your entries as JSON or
              CSV from Settings at any time.
            </li>
            <li>
              <strong>Delete</strong> — delete individual responses (removed
              from the database along with their AI embeddings) or your entire
              account from Settings.
            </li>
            <li>
              <strong>Correct</strong> — edit your responses and profile
              whenever you like.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Legacy access</h2>
          <p>
            If you designate legacy contacts, they can request access to your
            journal in the future under the scope you configured. Until then,
            they see nothing. You can change or remove legacy contacts at any
            time.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Children</h2>
          <p>
            Wisdom Journal is not directed at children under 13, and we do not
            knowingly collect their data.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">Changes & contact</h2>
          <p>
            We&apos;ll post any changes to this policy here and update the
            effective date. During the beta we may email you about important
            changes. Questions or requests:{" "}
            <a
              href="mailto:cole@marcuccilli.com"
              className="text-deep-sky hover:underline"
            >
              cole@marcuccilli.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
