"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [betaCode, setBetaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate beta code first
    try {
      const codeRes = await fetch("/api/beta/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: betaCode.trim() }),
      });
      const codeData = await codeRes.json();

      if (!codeData.valid) {
        setError(codeData.message || "Invalid invite code");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not validate invite code. Please try again.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, beta_code: betaCode.trim().toUpperCase() },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user with no identities when email already exists
    // (security feature to prevent email enumeration)
    if (signUpData?.user && signUpData.user.identities?.length === 0) {
      setError("An account with this email already exists. Please sign in instead.");
      setLoading(false);
      return;
    }

    // Increment the beta code usage
    try {
      await fetch("/api/beta/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: betaCode.trim().toUpperCase(), email }),
      });
    } catch {
      // Non-blocking
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleSignUp() {
    if (!betaCode.trim()) {
      setError("Please enter your beta invite code first");
      return;
    }

    // Validate code before OAuth
    try {
      const codeRes = await fetch("/api/beta/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: betaCode.trim() }),
      });
      const codeData = await codeRes.json();
      if (!codeData.valid) {
        setError(codeData.message || "Invalid invite code");
        return;
      }
    } catch {
      setError("Could not validate invite code");
      return;
    }

    // Store code in localStorage for the callback to pick up
    localStorage.setItem("beta_code", betaCode.trim().toUpperCase());

    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <h1 className="font-heading text-xl text-white text-center mb-2">
        Begin
      </h1>
      <p className="font-body text-sm text-white/40 text-center mb-8">
        Start preserving your wisdom today
      </p>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Beta Invite Code"
          type="text"
          placeholder="Enter your invite code"
          value={betaCode}
          onChange={(e) => setBetaCode(e.target.value)}
          required
        />
        <Input
          label="Full Name"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && (
          <div className="p-3 rounded-input bg-error/10 border border-error/20 text-error text-sm font-body">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <p className="text-xs font-body text-white/20 text-center leading-relaxed">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-white/30 hover:text-white/50 underline">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-white/30 hover:text-white/50 underline">Privacy Policy</a>.
        </p>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-4 text-white/30 font-body backdrop-blur-sm">
            or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        fullWidth
        onClick={handleGoogleSignUp}
        type="button"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </Button>

      <p className="text-center text-xs font-body text-white/30 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
