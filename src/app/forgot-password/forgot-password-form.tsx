"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

const labelClass = "text-label-sm text-on-surface-variant";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      },
    );

    // Don't reveal whether the email exists — always show the same confirmation
    // (unless the request itself failed, e.g. rate limit).
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
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
          If an account exists for{" "}
          <span className="text-on-surface font-medium">{sentTo}</span>,
          we&apos;ve sent a link to reset your password. It expires shortly, so
          use it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
            Sending link…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
