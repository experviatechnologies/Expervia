"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/shared/password-input";
import { ResendConfirmation } from "@/components/shared/resend-confirmation";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

const labelClass = "text-label-sm text-on-surface-variant";

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
          <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
            <MailCheck className="size-7" />
          </span>
          <h2 className="font-display text-body-lg text-on-surface font-bold">
            Check your inbox
          </h2>
          <p className="text-on-surface-variant text-sm">
            If an account exists for{" "}
            <span className="text-on-surface font-medium">{magicSentTo}</span>,
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

        {error && <p className="text-destructive text-sm">{error}</p>}
        {notice && (
          <p role="status" className="text-on-surface-variant text-sm">
            {notice}
          </p>
        )}

        <Button
          type="submit"
          variant="brand"
          size="pill-sm"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

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
            className="text-on-surface-variant hover:text-on-surface transition-colors"
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
            className="text-on-surface-variant hover:text-on-surface transition-colors"
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
          <PasswordInput
            id="password"
            name="password"
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
      {unconfirmed && (
        <ResendConfirmation
          email={unconfirmed}
          className="text-on-surface-variant border-outline-variant/30 rounded-xl border p-4"
        />
      )}

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
            {isMagic ? "Sending code…" : "Signing in…"}
          </>
        ) : isMagic ? (
          "Email me a sign-in code"
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
          : "Email me a sign-in code instead"}
      </button>
    </form>
  );
}
