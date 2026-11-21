"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { PasswordInput } from "@/components/shared/password-input";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/shared/turnstile-widget";
import { ResendConfirmation } from "@/components/shared/resend-confirmation";
import { Check, Info, MailCheck } from "lucide-react";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";
import { MntAuthShell } from "@/components/mentorship/mnt-auth-shell";

const DOMAINS = [
  { slug: "cloud-infrastructure", label: "Cloud & Infrastructure" },
  { slug: "modern-work", label: "Modern Work / M365" },
  { slug: "cybersecurity", label: "Cybersecurity" },
  { slug: "data-ai", label: "Data & AI" },
  { slug: "business-applications", label: "Business Applications" },
  { slug: "software-development", label: "Software Development" },
  { slug: "digital-transformation", label: "Digital Transformation" },
  { slug: "technology-leadership", label: "Technology Leadership" },
];

const inputClass = authInputClass;
const labelClass = authLabelClass;

const PANEL_POINTS = [
  ["Mentored by verified specialists", "matched to your capability goal."],
  ["Evidence that counts", "approved work builds your capability passport."],
  ["A path into ETEN", "validate your account to unlock live Circles."],
] as const;

function RegisterForm() {
  const searchParams = useSearchParams();
  // Preselect the role from the CTA the user came through (?role=mentor), so a
  // "Become a Mentor" click doesn't quietly default to a mentee account.
  const [role, setRole] = useState<"mentee" | "mentor">(
    searchParams.get("role") === "mentor" ? "mentor" : "mentee",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError("Please complete the verification below.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const payload = {
      fullName: String(fd.get("fullName") ?? ""),
      email,
      password: String(fd.get("password") ?? ""),
      intent: role,
      capabilityArea: String(fd.get("domain") ?? ""),
      [HONEYPOT_FIELD]: String(fd.get(HONEYPOT_FIELD) ?? ""),
      turnstileToken: captchaToken,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.error ?? "Something went wrong. Please try again.",
        );
      }
      setSentTo(email.toLowerCase());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MntAuthShell
      eyebrow="Join ETEN Mentorship"
      headline="Two minutes to start. A capability that lasts."
      aside={
        <ul className="flex flex-col gap-5">
          {PANEL_POINTS.map(([lead, rest]) => (
            <li key={lead} className="flex gap-4">
              <span className="text-brand-100 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Check aria-hidden className="size-5" />
              </span>
              <p className="text-brand-100/75 text-sm leading-relaxed">
                <span className="block font-semibold text-white">{lead}</span>
                {rest}
              </p>
            </li>
          ))}
        </ul>
      }
    >
      <div>
        {sentTo ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="bg-brand-100 text-brand-700 grid size-16 place-items-center rounded-full">
              <MailCheck aria-hidden className="size-8" />
            </span>
            <h1 className="font-jakarta text-brand-950 mt-5 text-3xl font-extrabold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-ink/70 mt-3 max-w-sm leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="text-brand-950 font-semibold">{sentTo}</span>.
              Click it to activate your account and set up your goal.
            </p>
            <ResendConfirmation
              email={sentTo}
              className="border-brand-100 text-ink/75 bg-lavender mt-6 w-full max-w-sm rounded-xl border p-4 text-sm"
              buttonClassName="text-brand-700 font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
            />
          </div>
        ) : (
          <>
            <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
              Create your account
            </h1>
            <p className="text-ink/65 mt-2">
              Choose how you want to take part. You can be both later.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <RoleCard
                selected={role === "mentee"}
                onClick={() => setRole("mentee")}
                title="Be a Mentee"
                desc="Join a Circle and grow toward a target V-level."
              />
              <RoleCard
                selected={role === "mentor"}
                onClick={() => setRole("mentor")}
                title="Be a Mentor"
                desc="Lead a Circle once you are a verified mentor."
              />
            </div>

            <form className="mt-6" onSubmit={handleSubmit} noValidate>
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    required
                    className={`${inputClass} mt-2`}
                    placeholder="Amara Okoye"
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`${inputClass} mt-2`}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="domain" className={labelClass}>
                  Capability area
                </label>
                <select
                  id="domain"
                  name="domain"
                  className={`${inputClass} mt-2`}
                >
                  {DOMAINS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={`${inputClass} pr-12`}
                  wrapperClassName="mt-2"
                  toggleClassName={authPasswordToggleClass}
                  placeholder="At least 8 characters"
                />
              </div>

              {TURNSTILE_ENABLED && (
                <div className="mt-4">
                  <TurnstileWidget onToken={setCaptchaToken} theme="light" />
                </div>
              )}

              {error && (
                <p role="alert" className={`${authErrorClass} mt-5`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${authSubmitClass} mt-7`}
              >
                {submitting
                  ? "Creating account…"
                  : role === "mentor"
                    ? "Create mentor account"
                    : "Create mentee account"}
              </button>
            </form>

            <div className="border-brand-100 bg-lavender mt-5 flex items-start gap-3 rounded-xl border p-4">
              <Info
                aria-hidden
                className="text-brand-700 mt-0.5 size-5 shrink-0"
              />
              <p className="text-ink/75 text-sm leading-relaxed">
                You will join as a <b className="text-brand-800">Prospect</b>.
                Complete <b className="text-brand-950">ETEN validation</b> after
                signing up to be fully activated as a {role}, and to join live
                Circles.
              </p>
            </div>

            <p className="text-ink/55 mt-4 text-center text-xs">
              By continuing you agree to the ETEN terms and privacy practices.
            </p>
            <p className="border-brand-100 text-ink/70 mt-6 border-t pt-6 text-[0.95rem]">
              Already have an account?{" "}
              <Link href="/mentorship/signin" className={authLinkClass}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </MntAuthShell>
  );
}

export default function MentorshipRegisterPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RoleCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "focus-visible:outline-brand-500 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 " +
        (selected
          ? "border-brand-600 bg-lavender shadow-[0_12px_30px_-18px_rgba(100,38,220,0.7)]"
          : "border-brand-100 hover:border-brand-300 bg-white")
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-jakarta text-brand-950 font-bold">{title}</span>
        <span
          className={
            "grid size-[18px] place-items-center rounded-full border-2 " +
            (selected ? "border-brand-600" : "border-brand-200")
          }
        >
          {selected && <span className="bg-brand-600 size-2 rounded-full" />}
        </span>
      </div>
      <div className="text-ink/65 mt-1.5 text-[13px] leading-relaxed">
        {desc}
      </div>
    </button>
  );
}
