"use client";

import { useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/site/auth-shell";

const inputClass = authInputClass;
const labelClass = authLabelClass;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);

    // The reset email is sent server-side via Resend (this project doesn't use
    // Supabase's built-in SMTP). The route always reports success, so the
    // response never reveals whether an account exists.
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, [HONEYPOT_FIELD]: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSentTo(clean);
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="bg-lavender text-brand-700 ring-brand-200/70 flex size-14 items-center justify-center rounded-full ring-1">
          <MailCheck aria-hidden className="size-7" />
        </span>
        <h2 className="font-jakarta text-brand-950 text-xl font-bold">
          Check your inbox
        </h2>
        <p className="text-ink/70">
          If an account exists for{" "}
          <span className="text-brand-950 font-semibold">{sentTo}</span>,
          we&apos;ve sent a link to reset your password. It expires shortly, so
          use it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
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

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor={HONEYPOT_FIELD}>Company URL</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className={authErrorClass}>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className={authSubmitClass}>
        {loading ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Sending link…
          </>
        ) : (
          <>
            Send reset link
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>
    </form>
  );
}
