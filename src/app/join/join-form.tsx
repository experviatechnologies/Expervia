"use client";

import { useState } from "react";
import { ArrowRight, Loader2, MailCheck, Sparkles } from "lucide-react";
import { PasswordInput } from "@/components/shared/password-input";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { ResendConfirmation } from "@/components/shared/resend-confirmation";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/shared/turnstile-widget";
import {
  COMMUNITY_INTERESTS,
  type CommunityInterest,
} from "@/lib/eten/community-interest";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";
import { cn } from "@/lib/utils";

/** 0-4: length, mixed case, digit, symbol. Guidance only, not a rule. */
function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = pw.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return pw.length < 8 ? Math.min(score, 1) : score;
}
const SCORE_LABEL = ["", "Weak", "Fair", "Good", "Strong"];

export function JoinForm({
  community = null,
}: {
  community?: CommunityInterest | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const score = passwordScore(password);

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
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError("Please complete the verification below.");
      return;
    }

    setLoading(true);
    setError(null);

    // Server-side route: anti-spam guards + we send our own confirmation email.
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/join/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          community,
          [HONEYPOT_FIELD]: String(fd.get(HONEYPOT_FIELD) ?? ""),
          turnstileToken: captchaToken,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSentTo(email.trim().toLowerCase());
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="bg-lavender text-brand-700 ring-brand-200/70 flex size-16 items-center justify-center rounded-full ring-1">
          <MailCheck aria-hidden className="size-8" />
        </span>
        <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight">
          Check your inbox
        </h1>
        <p className="text-ink/70">
          We sent a confirmation link to{" "}
          <span className="text-brand-950 font-semibold">{sentTo}</span>. Click
          it to activate your account and finish setting up your profile.
        </p>
        <ResendConfirmation
          email={sentTo}
          className="text-ink/75 border-brand-100 bg-lavender mt-2 w-full rounded-xl border p-4"
          buttonClassName="text-brand-700 font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold tracking-[0.18em] uppercase">
          <span className="text-brand-600">Step 1 of 2</span>
          <span className="text-ink/45">Your account</span>
        </div>
        <div
          role="progressbar"
          aria-label="Registration progress"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={1}
          className="mt-3 grid grid-cols-2 gap-1.5"
        >
          <span className="bg-brand-600 h-1.5 rounded-full" />
          <span className="bg-brand-100 h-1.5 rounded-full" />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Create your account
          </h1>
          <p className="text-ink/65 mt-2">
            It takes about two minutes. You&apos;ll add your profile on the next
            step.
          </p>
          {community && (
            <p className="border-brand-200 bg-lavender text-brand-800 mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold">
              <Sparkles aria-hidden className="size-4" />
              Joining {COMMUNITY_INTERESTS[community]}
            </p>
          )}
        </div>

        {/* Honeypot: off-screen, real users never fill it. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <label htmlFor={HONEYPOT_FIELD}>Company URL</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="fullName" className={authLabelClass}>
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
            className={authInputClass}
            placeholder="Ada Lovelace"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            toggleClassName={authPasswordToggleClass}
            aria-describedby="password-hint"
            placeholder="At least 8 characters"
          />
          <div aria-live="polite" className="flex items-center gap-3">
            <div aria-hidden className="flex flex-1 gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    score >= n
                      ? score <= 1
                        ? "bg-red-400"
                        : score === 2
                          ? "bg-amber-400"
                          : "bg-brand-600"
                      : "bg-brand-100",
                  )}
                />
              ))}
            </div>
            <span className="text-ink/60 w-14 text-right text-xs font-semibold">
              {SCORE_LABEL[score]}
            </span>
          </div>
          <p id="password-hint" className="text-ink/60 text-sm">
            At least 8 characters. A mix of letters, numbers and symbols is
            stronger.
          </p>
        </div>

        {TURNSTILE_ENABLED && (
          <TurnstileWidget onToken={setCaptchaToken} theme="light" />
        )}

        {error && (
          <p role="alert" className={authErrorClass}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4 pt-1">
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
          <p className="text-ink/60 text-sm leading-relaxed">
            By creating an account you agree to our terms and acknowledge our
            privacy practices.
          </p>
        </div>
      </form>
    </div>
  );
}
