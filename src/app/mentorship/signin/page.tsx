"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Target, TrendingUp, Users } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/shared/password-input";
import { ResendConfirmation } from "@/components/shared/resend-confirmation";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";
import {
  MntAuthPerks,
  MntAuthShell,
} from "@/components/mentorship/mnt-auth-shell";

const PERKS = [
  {
    icon: Users,
    title: "Your Circles",
    text: "Pick up with your mentor or mentees where you left off.",
  },
  {
    icon: CalendarCheck,
    title: "Sessions and bookings",
    text: "See what's coming up and book your next session.",
  },
  {
    icon: Target,
    title: "Goals and evidence",
    text: "Track your goal and the work that proves your progress.",
  },
  {
    icon: TrendingUp,
    title: "Your growth",
    text: "Watch your capability level move up over time.",
  },
];

export default function MentorshipSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError) {
      if (signInError.code === "email_not_confirmed") {
        setUnconfirmed(email.trim().toLowerCase());
        setError(
          "Your email isn't confirmed yet. Use the link we emailed you, or get a new one below.",
        );
      } else {
        setUnconfirmed(null);
        setError("That email or password is not right. Please try again.");
      }
      setLoading(false);
      return;
    }
    // The dashboard sends mentors to their own view based on intent.
    router.push("/mentorship/dashboard");
    router.refresh();
  }

  return (
    <MntAuthShell
      eyebrow="Mentorship sign in"
      headline="Welcome back. Your growth journey continues here."
      aside={<MntAuthPerks items={PERKS} label="In your mentorship account" />}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Sign in to ETEN Mentorship
          </h1>
          <p className="text-ink/65 mt-2">
            Use the email and password you registered with.
          </p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-2">
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
              className={authInputClass}
              placeholder="you@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={authLabelClass}>
                Password
              </label>
              <Link
                href="/mentorship/forgot-password"
                className={`${authLinkClass} text-sm`}
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-12`}
              toggleClassName={authPasswordToggleClass}
              placeholder="Your password"
            />
          </div>

          {error && (
            <p role="alert" className={authErrorClass}>
              {error}
            </p>
          )}
          {unconfirmed && (
            <ResendConfirmation
              email={unconfirmed}
              className="border-brand-100 text-ink/75 bg-lavender rounded-xl border p-4 text-sm"
              buttonClassName="text-brand-700 font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
            />
          )}

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="border-brand-100 text-ink/70 border-t pt-6 text-[0.95rem]">
          New here?{" "}
          <Link href="/mentorship/register" className={authLinkClass}>
            Create an account
          </Link>
        </p>
      </div>
    </MntAuthShell>
  );
}
