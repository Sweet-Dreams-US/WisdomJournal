import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-blue/10 flex items-center justify-center">
        <FileText className="w-8 h-8 text-sky-blue" />
      </div>

      <h1 className="font-heading text-xl text-white mb-2">
        Terms of Service
      </h1>
      <p className="font-body text-sm text-white/40 mb-8 leading-relaxed">
        Our terms of service are coming soon. We are preparing a clear and fair
        set of terms for using Wisdom Journal. Thank you for your patience.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 font-body text-sm text-sky-blue hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
