import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cloud-white">
      <header className="border-b border-charcoal/[0.06] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-deep-sky to-sky-blue flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg text-twilight">Wisdom</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-charcoal/60">
            <Link href="/privacy" className="hover:text-charcoal transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-charcoal transition-colors">
              Terms
            </Link>
            <Link
              href="/register"
              className="text-deep-sky font-semibold hover:text-sky-blue transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
      <footer className="border-t border-charcoal/[0.06] py-8 text-center text-xs text-charcoal/40">
        © {new Date().getFullYear()} Sweet Dreams Music LLC · Wisdom Journal
      </footer>
    </div>
  );
}
