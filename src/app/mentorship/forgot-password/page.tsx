"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";

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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-14">
      <div className="w-full max-w-[400px]">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br font-extrabold">
            E
          </span>
          <span className="font-display text-[15px] font-extrabold">
            ETEN Mentorship
          </span>
        </Link>

        {sentTo ? (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <span className="bg-mnt-brand/12 text-mnt-brand flex size-14 items-center justify-center rounded-full">
              <MailCheck className="size-7" />
            </span>
            <h1 className="font-display text-xl font-extrabold">
              Check your inbox
            </h1>
            <p className="text-mnt-ink-muted text-[14px]">
              If an account exists for{" "}
              <span className="text-mnt-ink font-medium">{sentTo}</span>,
              we&apos;ve sent a link to set a new password. It expires soon, so
              use it while it&apos;s fresh.
            </p>
            <Link
              href="/mentorship/signin"
              className="text-mnt-brand mt-2 text-[13px]"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display mt-8 text-2xl font-extrabold">
              Forgot your password?
            </h1>
            <p className="text-mnt-ink-muted mt-2 text-[14px]">
              Enter your email and we&apos;ll send you a link to set a new one.
            </p>

            <form className="mt-6" onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="email"
                className="text-mnt-ink-muted text-[12.5px] font-medium"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
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
                <p className="text-destructive mt-4 text-[13px]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-mnt-brand text-mnt-on-brand mt-6 w-full rounded-[11px] py-3.5 text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Sending link…" : "Send reset link"}
              </button>
            </form>

            <p className="text-mnt-faint mt-6 text-center text-[13px]">
              Remembered it?{" "}
              <Link href="/mentorship/signin" className="text-mnt-brand">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
