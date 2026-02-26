"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Check that the user arrived here via a valid recovery link
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a brief pause
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-sky-blue/30 border-t-sky-blue rounded-full animate-spin" />
        <p className="font-body text-sm text-white/40 mt-4">Verifying your reset link...</p>
      </div>
    );
  }

  // No valid session — link expired or invalid
  if (!hasSession) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>

        <h1 className="font-heading text-xl text-white mb-2">
          Link Expired
        </h1>
        <p className="font-body text-sm text-white/40 mb-6 leading-relaxed">
          This password reset link has expired or is invalid.
          <br />
          Please request a new one.
        </p>

        <Link href="/forgot-password">
          <Button fullWidth>Request New Reset Link</Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="font-heading text-xl text-white mb-2">
          Password Updated
        </h1>
        <p className="font-body text-sm text-white/40 mb-6">
          Your password has been reset successfully.
          <br />
          Redirecting you to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <h1 className="font-heading text-xl text-white text-center mb-2">
        Set New Password
      </h1>
      <p className="font-body text-sm text-white/40 text-center mb-8">
        Choose a strong password for your account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && (
          <div className="p-3 rounded-input bg-error/10 border border-error/20 text-error text-sm font-body">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
