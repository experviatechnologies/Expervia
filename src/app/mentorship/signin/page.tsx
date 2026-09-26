"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/shared/password-input";

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";

export default function MentorshipSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError("That email or password is not right. Please try again.");
      setLoading(false);
      return;
    }
    // The dashboard sends mentors to their own view based on intent.
    router.push("/mentorship/dashboard");
    router.refresh();
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

        <h1 className="font-display mt-8 text-2xl font-extrabold">
          Welcome back
        </h1>
        <p className="text-mnt-ink-muted mt-2 text-[14px]">
          Sign in to your mentorship account.
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

          <div className="mt-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-mnt-ink-muted text-[12.5px] font-medium"
              >
                Password
              </label>
              <Link
                href="/mentorship/forgot-password"
                className="text-mnt-brand text-[12.5px]"
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
              className={inputClass.replace("mt-1.5", "")}
              wrapperClassName="mt-1.5"
              placeholder="Your password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-mnt-faint mt-6 text-center text-[13px]">
          New here?{" "}
          <Link href="/mentorship/register" className="text-mnt-brand">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
