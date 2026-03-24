import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-blue/10 flex items-center justify-center">
        <Shield className="w-8 h-8 text-sky-blue" />
      </div>

      <h1 className="font-heading text-xl text-white mb-2">
        Privacy Policy
      </h1>
      <p className="font-body text-sm text-white/40 mb-8 leading-relaxed">
        Our privacy policy is coming soon. We take your privacy seriously and
        are working on a comprehensive policy. In the meantime, rest assured
        that your data is stored securely and never shared with third parties.
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
