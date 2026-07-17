import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Wisdom Journal.",
};

const EFFECTIVE_DATE = "July 16, 2026";

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-3xl text-twilight mb-2">Terms of Service</h1>
      <p className="text-sm text-charcoal/50 mb-10">
        Effective {EFFECTIVE_DATE} · Wisdom Journal is operated by Sweet Dreams
        Music LLC (&quot;we,&quot; &quot;us&quot;).
      </p>

      <div className="space-y-8 text-[15px] leading-relaxed text-charcoal/80">
        <section>
          <h2 className="text-xl text-twilight mb-3">1. The service</h2>
          <p>
            Wisdom Journal helps you capture your knowledge, stories, and
            values through daily guided questions, and lets people you
            authorize explore that archive — including with AI assistance. By
            creating an account you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">
            2. Beta status — please read
          </h2>
          <p>
            Wisdom Journal is currently in <strong>beta</strong>. Features may
            change, break, or be removed. While we work hard to protect your
            data (and you can export it at any time), you should not treat the
            beta as your only copy of anything irreplaceable. We appreciate
            your patience and your feedback.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">3. Your content</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              You own everything you write or dictate into Wisdom Journal.
            </li>
            <li>
              You grant us the limited license needed to store, process, and
              display your content — solely to operate the service (including
              the AI features you or your authorized people invoke).
            </li>
            <li>
              We never sell your content or use it to train AI models.
            </li>
            <li>
              You are responsible for what you share and with whom. Sharing
              features (friends, groups, links, access grants, legacy
              contacts) act on your instructions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">4. AI features</h2>
          <p>
            AI-generated answers, insights, and summaries are produced by
            language models working from your journal entries.{" "}
            <strong>
              They can be wrong, incomplete, or phrased in ways the original
              author never intended.
            </strong>{" "}
            The verbatim journal entries are always the source of truth, and
            AI answers cite the entries they drew from. AI content is not
            professional, legal, medical, or financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">5. Acceptable use</h2>
          <p className="mb-3">Don&apos;t use Wisdom Journal to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Break the law or violate others&apos; rights.</li>
            <li>
              Impersonate another person or upload content you don&apos;t have
              the right to store.
            </li>
            <li>
              Probe, overload, or disrupt the service or other users&apos;
              data.
            </li>
          </ul>
          <p className="mt-3">
            We may suspend accounts that violate these rules, with notice when
            practical.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">6. Your account</h2>
          <p>
            Keep your credentials safe — you&apos;re responsible for activity
            under your account. You can delete your account at any time from
            Settings; deletion permanently removes your journal from our
            systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">7. Pricing</h2>
          <p>
            The beta is free. If we introduce paid plans, we&apos;ll announce
            them clearly and nothing will be charged without your explicit
            opt-in.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">8. Disclaimers</h2>
          <p>
            The service is provided &quot;as is&quot; during the beta, without
            warranties of any kind. To the maximum extent permitted by law,
            Sweet Dreams Music LLC is not liable for indirect, incidental, or
            consequential damages arising from your use of the service. Our
            total liability for any claim is limited to the amount you paid us
            in the twelve months before the claim (during the free beta, that
            is $0).
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">9. Governing law</h2>
          <p>
            These terms are governed by the laws of the State of Indiana, USA,
            without regard to conflict-of-law rules.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-twilight mb-3">10. Changes & contact</h2>
          <p>
            We may update these terms as the product evolves; we&apos;ll post
            updates here and refresh the effective date. Questions:{" "}
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
