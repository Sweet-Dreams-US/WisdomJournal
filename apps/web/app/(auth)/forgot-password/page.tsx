"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-blue/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-sky-blue" />
        </div>

        <h1 className="font-heading text-xl text-white mb-2">
          Check Your Email
        </h1>
        <p className="font-body text-sm text-white/40 mb-6 leading-relaxed">
          We sent a password reset link to{" "}
          <span className="text-white/60">{email}</span>.
          <br />
          Click the link in the email to reset your password.
        </p>

        <p className="font-body text-xs text-white/25 mb-6">
          Didn&apos;t receive it? Check your spam folder or try again.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setSent(false)}
          >
            Try Another Email
          </Button>
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

  return (
    <div className="glass-card rounded-2xl p-8">
      <h1 className="font-heading text-xl text-white text-center mb-2">
        Reset Password
      </h1>
      <p className="font-body text-sm text-white/40 text-center mb-8">
        Enter your email and we&apos;ll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && (
          <div className="p-3 rounded-input bg-error/10 border border-error/20 text-error text-sm font-body">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-xs font-body text-white/30 mt-6">
        <Link href="/login" className="text-sky-blue hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
