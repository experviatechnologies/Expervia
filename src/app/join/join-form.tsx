"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

const labelClass = "text-label-sm text-on-surface-variant";

export function JoinForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function validate(): string | null {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return "Please enter a valid email address.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (signUpError) {
      // Supabase returns a generic message for an already-registered email when
      // "confirm email" is on; surface a helpful hint either way.
      setError(
        signUpError.message.toLowerCase().includes("registered")
          ? "That email is already registered. Try signing in instead."
          : signUpError.message,
      );
      setLoading(false);
      return;
    }

    // If email confirmation is required, there is no session yet — tell them to
    // check their inbox. If it's disabled, a session exists and we go straight in.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSentTo(email.trim().toLowerCase());
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <MailCheck className="size-7" />
        </span>
        <h2 className="font-display text-body-lg text-on-surface font-bold">
          Check your inbox
        </h2>
        <p className="text-on-surface-variant text-sm">
          We sent a confirmation link to{" "}
          <span className="text-on-surface font-medium">{sentTo}</span>. Click
          it to activate your account and finish setting up your profile.
        </p>
        <p className="text-on-surface-variant/70 text-xs">
          Didn&apos;t get it? Check spam, or wait a minute and try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Ada Lovelace"
        />
      </div>

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

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>

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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-on-surface-variant/70 text-center text-xs">
        By creating an account you agree to our terms and acknowledge our
        privacy practices.
      </p>
    </form>
  );
}
