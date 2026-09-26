"use client";

import { useState } from "react";
import Link from "next/link";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { PasswordInput } from "@/components/shared/password-input";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/shared/turnstile-widget";

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

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";
const labelClass = "text-mnt-ink-muted text-[12.5px] font-medium";

function Logo() {
  return (
    <Link href="/mentorship" className="flex items-center gap-2.5">
      <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br font-extrabold">
        E
      </span>
      <span className="font-display text-[15px] font-extrabold">
        ETEN Mentorship
      </span>
    </Link>
  );
}

export default function MentorshipRegisterPage() {
  const [role, setRole] = useState<"mentee" | "mentor">("mentee");
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
    <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
      {/* LEFT brand panel (desktop) */}
      <aside className="border-mnt-line relative hidden flex-col justify-between border-r p-12 [background:linear-gradient(160deg,#0f1520,#0b0e13)] lg:flex">
        <Logo />
        <div>
          <h1 className="font-display max-w-[18rem] text-[34px] leading-[1.12] font-extrabold text-balance">
            Two minutes to start. A capability that lasts.
          </h1>
          <ul className="mt-7 flex flex-col gap-4">
            {[
              [
                "Mentored by verified specialists",
                "matched to your capability goal.",
              ],
              [
                "Evidence that counts",
                "approved work builds your capability passport.",
              ],
              [
                "A path into ETEN",
                "validate your account to unlock live Circles.",
              ],
            ].map(([lead, rest]) => (
              <li key={lead} className="flex items-start gap-3">
                <span className="bg-mnt-brand/14 text-mnt-brand mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-md text-[13px]">
                  ✓
                </span>
                <span className="text-mnt-ink-muted text-[13.5px] leading-relaxed">
                  <b className="text-mnt-ink">{lead}</b>, {rest}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-mnt-faint text-[12px]">
          Already have an account?{" "}
          <Link href="/mentorship/signin" className="text-mnt-brand">
            Sign in
          </Link>
        </div>
      </aside>

      {/* RIGHT form */}
      <main className="flex flex-col justify-center px-6 py-14 sm:px-14">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          {sentTo ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="bg-mnt-brand/12 text-mnt-brand grid size-14 place-items-center rounded-full text-2xl">
                ✓
              </span>
              <h2 className="font-display mt-5 text-2xl font-extrabold">
                Check your inbox
              </h2>
              <p className="text-mnt-ink-muted mt-2 max-w-sm text-[14px] leading-relaxed">
                We sent a confirmation link to{" "}
                <span className="text-mnt-ink font-medium">{sentTo}</span>.
                Click it to activate your account and set up your goal.
              </p>
              <p className="text-mnt-faint mt-3 text-[12px]">
                Did not get it? Check spam, or wait a minute and try again.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-extrabold">
                Create your account
              </h2>
              <p className="text-mnt-ink-muted mt-2 text-[14px]">
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

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      required
                      className={inputClass}
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
                      className={inputClass}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div className="mt-3.5">
                  <label htmlFor="domain" className={labelClass}>
                    Capability area
                  </label>
                  <select id="domain" name="domain" className={inputClass}>
                    {DOMAINS.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3.5">
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className={inputClass.replace("mt-1.5", "")}
                    wrapperClassName="mt-1.5"
                    placeholder="At least 8 characters"
                  />
                </div>

                {TURNSTILE_ENABLED && (
                  <div className="mt-4">
                    <TurnstileWidget onToken={setCaptchaToken} theme="dark" />
                  </div>
                )}

                {error && (
                  <p className="text-destructive mt-4 text-[13px]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-mnt-brand text-mnt-on-brand mt-6 w-full rounded-[11px] py-3.5 text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Create account"}
                </button>
              </form>

              <div className="border-mnt-amber/28 mt-[18px] flex items-start gap-3 rounded-xl border p-3.5 [background:rgba(245,177,61,0.07)]">
                <span className="bg-mnt-amber/18 text-mnt-amber mt-px grid size-5 shrink-0 place-items-center rounded-full text-[12px]">
                  !
                </span>
                <p className="text-mnt-ink-muted text-[12.5px] leading-relaxed">
                  You will join as a <b className="text-mnt-amber">Prospect</b>.
                  Complete <b className="text-mnt-ink">ETEN validation</b> after
                  signing up to be fully activated as a {role}, and to join live
                  Circles.
                </p>
              </div>

              <p className="text-mnt-faint mt-4 text-center text-[11.5px]">
                By continuing you agree to the ETEN terms and privacy practices.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
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
        "rounded-[14px] border p-4 text-left transition " +
        (selected
          ? "border-mnt-brand [background:rgba(167,140,250,0.08)]"
          : "border-mnt-line bg-mnt-panel-2 hover:border-mnt-line-strong")
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-bold">{title}</span>
        <span
          className={
            "grid size-[18px] place-items-center rounded-full border-2 " +
            (selected ? "border-mnt-brand" : "border-mnt-line-strong")
          }
        >
          {selected && <span className="bg-mnt-brand size-2 rounded-full" />}
        </span>
      </div>
      <div className="text-mnt-ink-muted mt-1.5 text-[12.5px] leading-relaxed">
        {desc}
      </div>
    </button>
  );
}
