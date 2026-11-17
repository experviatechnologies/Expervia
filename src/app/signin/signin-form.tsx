"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/shared/password-input";
import { ResendConfirmation } from "@/components/shared/resend-confirmation";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";

const inputClass = authInputClass;
const labelClass = authLabelClass;
const secondaryClass =
  "text-ink/65 hover:text-brand-700 text-sm font-medium transition-colors";

export function SignInForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

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
      // An account that never confirmed its email: say so, and offer a new
      // link (the first one may be sitting in Spam or Promotions).
      if (signInError.code === "email_not_confirmed") {
        setUnconfirmed(email.trim().toLowerCase());
        setError(
          "Your email isn't confirmed yet. Use the link we emailed you, or get a new one below.",
        );
      } else {
        setUnconfirmed(null);
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function sendCode(): Promise<boolean> {
    const res = await fetch("/api/auth/sign-in-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        next,
        [HONEYPOT_FIELD]: "",
      }),
    }).catch(() => null);
    if (!res) {
      setError("We couldn't reach ETEN. Check your connection and try again.");
      return false;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "We couldn't send a code. Please try again.");
      return false;
    }
    return true;
  }

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    if (await sendCode()) setMagicSentTo(email.trim().toLowerCase());
    setLoading(false);
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setError("Enter the code from the email.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    // "email" covers sign-in codes for confirmed and unconfirmed accounts;
    // "magiclink" is the older name some projects still need.
    let { error: verifyError } = await supabase.auth.verifyOtp({
      email: magicSentTo ?? "",
      token,
      type: "email",
    });
    if (verifyError) {
      ({ error: verifyError } = await supabase.auth.verifyOtp({
        email: magicSentTo ?? "",
        token,
        type: "magiclink",
      }));
    }
    if (verifyError) {
      setError(
        "That code didn't work. Check it, or request a new one: each code works once and expires after a short time.",
      );
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (magicSentTo) {
    return (
      <form
        onSubmit={handleCodeSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-lavender text-brand-700 ring-brand-200/70 flex size-14 items-center justify-center rounded-full ring-1">
            <MailCheck aria-hidden className="size-7" />
          </span>
          <h2 className="font-jakarta text-brand-950 text-xl font-bold">
            Check your inbox
          </h2>
          <p className="text-ink/70 text-sm">
            If an account exists for{" "}
            <span className="text-brand-950 font-semibold">{magicSentTo}</span>,
            we&apos;ve emailed a sign-in code. Enter it below, or use the button
            in the email.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="code" className={labelClass}>
            Sign-in code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
            className={`${inputClass} text-center font-mono text-xl tracking-[0.3em]`}
            placeholder="123456"
          />
        </div>

        {error && (
          <p role="alert" className={authErrorClass}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-ink/70 text-sm">
            {notice}
          </p>
        )}

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError(null);
              setNotice(null);
              setLoading(true);
              if (await sendCode()) setNotice("We've sent a new code.");
              setLoading(false);
            }}
            className={secondaryClass}
          >
            Send a new code
          </button>
          <button
            type="button"
            onClick={() => {
              setMagicSentTo(null);
              setCode("");
              setError(null);
              setNotice(null);
            }}
            className={secondaryClass}
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  const isMagic = mode === "magic";

  return (
    <form
      onSubmit={isMagic ? handleMagicSubmit : handlePasswordSubmit}
      noValidate
      className="flex flex-col gap-6"
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
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className={`text-sm ${authLinkClass}`}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            toggleClassName={authPasswordToggleClass}
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Your password"
          />
        </div>
      )}

      {error && (
        <p role="alert" className={authErrorClass}>
          {error}
        </p>
      )}
      {unconfirmed && (
        <ResendConfirmation
          email={unconfirmed}
          className="text-ink/75 border-brand-100 bg-lavender rounded-xl border p-4"
          buttonClassName="text-brand-700 font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
        />
      )}

      <button type="submit" disabled={loading} className={authSubmitClass}>
        {loading ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {isMagic ? "Sending code…" : "Signing in…"}
          </>
        ) : (
          <>
            {isMagic ? "Email me a sign-in code" : "Sign in"}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(isMagic ? "password" : "magic");
          setError(null);
        }}
        className={`${secondaryClass} text-center`}
      >
        {isMagic
          ? "Sign in with a password instead"
          : "Email me a sign-in code instead"}
      </button>
    </form>
  );
}
