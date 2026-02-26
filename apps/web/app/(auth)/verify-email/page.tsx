"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const email = searchParams.get("email");

  // After email is confirmed (redirected here from callback)
  if (confirmed) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="font-heading text-xl text-white mb-2">
          Email Confirmed
        </h1>
        <p className="font-body text-sm text-white/40 mb-8 leading-relaxed">
          Your email has been verified successfully.
          <br />
          You&apos;re all set to start your wisdom journey.
        </p>

        <Link href="/dashboard">
          <Button fullWidth>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Initial state — user just signed up, needs to check email
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-blue/10 flex items-center justify-center">
        <Mail className="w-8 h-8 text-sky-blue" />
      </div>

      <h1 className="font-heading text-xl text-white mb-2">
        Check Your Email
      </h1>
      <p className="font-body text-sm text-white/40 mb-2 leading-relaxed">
        We sent a confirmation link to
      </p>
      {email && (
        <p className="font-body text-sm text-white/70 mb-6 font-semibold">
          {email}
        </p>
      )}
      <p className="font-body text-sm text-white/40 mb-8 leading-relaxed">
        Click the link in the email to activate your account.
        <br />
        It may take a minute to arrive.
      </p>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-white/3 border border-white/5">
          <p className="font-body text-xs text-white/30 leading-relaxed">
            <span className="text-white/50 font-semibold">Tip:</span> If you
            don&apos;t see the email, check your spam or promotions folder.
          </p>
        </div>

        <Link href="/login">
          <Button variant="ghost" fullWidth>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
