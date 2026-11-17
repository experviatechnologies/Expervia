"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { witContributionInterests } from "@/config/women-in-tech";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/shared/turnstile-widget";

const PRIVACY_HREF =
  siteConfig.footerNav.legal.find((l) => l.title === "Privacy Policy")?.href ??
  "/contact";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 outline-none transition-colors focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 aria-invalid:border-destructive";
const labelClass = "text-on-surface mb-2 block text-sm font-medium";

type Errors = Partial<
  Record<
    "fullName" | "email" | "role" | "interests" | "profile" | "privacy",
    string
  >
>;

function validate(fd: FormData, interests: string[]): Errors {
  const errors: Errors = {};
  const val = (k: string) => String(fd.get(k) ?? "").trim();
  if (val("fullName").length < 2)
    errors.fullName = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email")))
    errors.email = "Please enter a valid email address.";
  if (val("role").length < 2)
    errors.role = "Please tell us your role or area of expertise.";
  if (!interests.length)
    errors.interests = "Choose at least one way you would like to contribute.";
  const profile = val("profile");
  if (profile && !/^https?:\/\/\S+$/i.test(profile))
    errors.profile = "Use a full link starting with https://";
  if (fd.get("privacy") !== "on")
    errors.privacy = "Please confirm you have read the privacy notice.";
  return errors;
}

function ErrorText({ name, errors }: { name: keyof Errors; errors: Errors }) {
  return errors[name] ? (
    <p id={`${name}-error`} className="text-destructive mt-1.5 text-sm">
      {errors[name]}
    </p>
  ) : null;
}

export function ContributorForm() {
  // When the form appeared; bots that submit within seconds are dropped.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [interests, setInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  function toggleInterest(value: string) {
    setInterests((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );
    setErrors((e) => ({ ...e, interests: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const found = validate(fd, interests);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      const target =
        firstInvalid === "interests"
          ? form.querySelector<HTMLInputElement>('input[name="interests"]')
          : form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
      target?.focus();
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setFormError("Please complete the verification check.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/women-in-tech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          email: fd.get("email"),
          role: fd.get("role"),
          interests,
          profile: fd.get("profile"),
          message: fd.get("message"),
          privacy: fd.get("privacy") === "on",
          [HONEYPOT_FIELD]: String(fd.get(HONEYPOT_FIELD) ?? ""),
          elapsedMs: Date.now() - startedAt.current,
          turnstileToken: captchaToken,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(json?.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Count only; never send form content to analytics.
      trackEvent("women_in_tech_contributor_submit", {
        interest_count: interests.length,
      });
      setSubmitted(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <CheckCircle2 className="text-primary size-14" aria-hidden />
        <h3 className="font-display text-on-surface text-headline-md font-bold">
          Thank you for your interest.
        </h3>
        <p className="text-on-surface-variant max-w-md">
          Your expression of interest has reached the ETEN team. We review every
          submission and will be in touch by email about next steps.
        </p>
      </div>
    );
  }

  const describe = (key: keyof Errors) =>
    errors[key] ? `${key}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot: off-screen, real users never fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] size-px overflow-hidden"
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

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="wit-fullName" className={labelClass}>
            Full name <span className="text-primary">*</span>
          </label>
          <input
            id="wit-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={120}
            required
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describe("fullName")}
            className={fieldClass}
          />
          <ErrorText name="fullName" errors={errors} />
        </div>
        <div>
          <label htmlFor="wit-email" className={labelClass}>
            Email address <span className="text-primary">*</span>
          </label>
          <input
            id="wit-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describe("email")}
            className={fieldClass}
          />
          <ErrorText name="email" errors={errors} />
        </div>
      </div>

      <div>
        <label htmlFor="wit-role" className={labelClass}>
          Professional role or area of expertise{" "}
          <span className="text-primary">*</span>
        </label>
        <input
          id="wit-role"
          name="role"
          type="text"
          maxLength={160}
          required
          placeholder="e.g. Cloud Security Engineer"
          aria-invalid={Boolean(errors.role)}
          aria-describedby={describe("role")}
          className={fieldClass}
        />
        <ErrorText name="role" errors={errors} />
      </div>

      <fieldset aria-describedby={describe("interests")}>
        <legend className={labelClass}>
          How would you like to contribute?{" "}
          <span className="text-primary">*</span>
          <span className="text-on-surface-variant ml-1 font-normal">
            (choose any)
          </span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {witContributionInterests.map((option) => (
            <label
              key={option}
              className="border-outline-variant has-checked:border-brand has-checked:bg-brand/10 has-focus-visible:ring-brand/40 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-focus-visible:ring-2"
            >
              <input
                type="checkbox"
                name="interests"
                value={option}
                checked={interests.includes(option)}
                onChange={() => toggleInterest(option)}
                className="accent-brand"
              />
              {option}
            </label>
          ))}
        </div>
        <ErrorText name="interests" errors={errors} />
      </fieldset>

      <div>
        <label htmlFor="wit-profile" className={labelClass}>
          LinkedIn or professional profile{" "}
          <span className="text-on-surface-variant font-normal">
            (optional)
          </span>
        </label>
        <input
          id="wit-profile"
          name="profile"
          type="url"
          inputMode="url"
          maxLength={300}
          placeholder="https://linkedin.com/in/your-name"
          aria-invalid={Boolean(errors.profile)}
          aria-describedby={describe("profile")}
          className={fieldClass}
        />
        <ErrorText name="profile" errors={errors} />
      </div>

      <div>
        <label htmlFor="wit-message" className={labelClass}>
          A short introduction{" "}
          <span className="text-on-surface-variant font-normal">
            (optional)
          </span>
        </label>
        <textarea
          id="wit-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your experience and how you would like to contribute."
          className={fieldClass}
        />
      </div>

      <div>
        <label className="text-on-surface-variant flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="privacy"
            aria-invalid={Boolean(errors.privacy)}
            aria-describedby={describe("privacy")}
            onChange={() => setErrors((e) => ({ ...e, privacy: undefined }))}
            className="accent-brand mt-0.5 size-4 shrink-0"
          />
          <span>
            I agree that Expervia Technologies may use these details to review
            my interest and contact me about contributing to ETEN Women in Tech,
            as described in the{" "}
            <Link href={PRIVACY_HREF} className="text-primary underline">
              privacy policy
            </Link>
            . <span className="text-primary">*</span>
          </span>
        </label>
        <ErrorText name="privacy" errors={errors} />
      </div>

      {TURNSTILE_ENABLED && (
        <TurnstileWidget onToken={setCaptchaToken} theme="dark" />
      )}

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand text-brand-foreground primary-glow focus-visible:ring-primary flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold transition-all outline-none hover:brightness-110 focus-visible:ring-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {submitting ? "Sending…" : "Submit Expression of Interest"}
      </button>
      <p className="text-on-surface-variant/80 text-center text-xs">
        Submitting is an expression of interest, not an application for a role,
        appointment or paid engagement.
      </p>
    </form>
  );
}
