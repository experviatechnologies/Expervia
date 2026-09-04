"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

const labelClass = "text-label-sm text-on-surface-variant";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Don't create an account from the sign-in page — existing members only.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setMagicSentTo(email.trim().toLowerCase());
    setLoading(false);
  }

  if (magicSentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <MailCheck className="size-7" />
        </span>
        <h2 className="font-display text-body-lg text-on-surface font-bold">
          Check your inbox
        </h2>
        <p className="text-on-surface-variant text-sm">
          If an account exists for{" "}
          <span className="text-on-surface font-medium">{magicSentTo}</span>,
          we&apos;ve sent a one-time sign-in link. Click it to continue.
        </p>
      </div>
    );
  }

  const isMagic = mode === "magic";

  return (
    <form
      onSubmit={isMagic ? handleMagicSubmit : handlePasswordSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      {!isMagic && (
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        variant="brand"
        size="pill-sm"
        disabled={loading}
        className="mt-2 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {isMagic ? "Sending link…" : "Signing in…"}
          </>
        ) : isMagic ? (
          "Email me a sign-in link"
        ) : (
          "Sign in"
        )}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(isMagic ? "password" : "magic");
          setError(null);
        }}
        className="text-on-surface-variant hover:text-on-surface text-center text-sm transition-colors"
      >
        {isMagic
          ? "Sign in with a password instead"
          : "Email me a sign-in link instead"}
      </button>
    </form>
  );
}
