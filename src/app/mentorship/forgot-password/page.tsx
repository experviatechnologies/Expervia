"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authSubmitClass,
} from "@/components/site/auth-shell";
import { MntAuthShell } from "@/components/mentorship/mnt-auth-shell";

export default function MentorshipForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mentorship/forgot-password", {
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
      setSentTo(clean);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <MntAuthShell
      eyebrow="Account help"
      headline="Locked out? We'll get you back to your mentorship in minutes."
    >
      <div>
        {sentTo ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="bg-brand-100 text-brand-700 flex size-16 items-center justify-center rounded-full">
              <MailCheck aria-hidden className="size-8" />
            </span>
            <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-ink/70 leading-relaxed">
              If an account exists for{" "}
              <span className="text-brand-950 font-semibold">{sentTo}</span>,
              we&apos;ve sent a link to set a new password. It expires soon, so
              use it while it&apos;s fresh.
            </p>
            <Link href="/mentorship/signin" className={`${authLinkClass} mt-2`}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
              Forgot your password?
            </h1>
            <p className="text-ink/65 mt-2">
              Enter your email and we&apos;ll send you a link to set a new one.
            </p>

            <form className="mt-7" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email" className={authLabelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${authInputClass} mt-2`}
                placeholder="you@email.com"
              />

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
                <p role="alert" className={`${authErrorClass} mt-5`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${authSubmitClass} mt-6`}
              >
                {loading ? "Sending link…" : "Send reset link"}
              </button>
            </form>

            <p className="border-brand-100 text-ink/70 mt-6 border-t pt-6 text-[0.95rem]">
              Remembered it?{" "}
              <Link href="/mentorship/signin" className={authLinkClass}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </MntAuthShell>
  );
}
