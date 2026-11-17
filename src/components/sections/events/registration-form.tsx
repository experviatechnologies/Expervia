"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";

const countries = ["Kenya", "Nigeria", "South Africa", "Ghana", "Other"];

const expertiseAreas = [
  "Azure & Cloud",
  "AI & Microsoft Copilot",
  "Cybersecurity",
  "Microsoft 365 / Modern Work",
  "Data & AI",
  "Business Applications",
  "Software Development",
  "DevOps",
  "Digital Transformation",
  "Other",
];

const membershipOptions = ["Yes", "No", "I would like to join"];

const heardFromOptions = ["ETEN Network", "LinkedIn", "WhatsApp", "Email"];

const fieldClasses =
  "w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 shadow-[0_1px_2px_rgba(33,0,93,0.04)] outline-none transition hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

const labelClasses = "block text-sm font-semibold text-brand-950";

export function RegistrationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      country: String(formData.get("country") ?? ""),
      city: String(formData.get("city") ?? ""),
      jobTitle: String(formData.get("jobTitle") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      areaOfExpertise: String(formData.get("areaOfExpertise") ?? ""),
      membershipStatus: String(formData.get("membershipStatus") ?? ""),
      heardFrom: formData
        .getAll("heardFrom")
        .filter((v): v is string => typeof v === "string"),
      learningGoals: String(formData.get("learningGoals") ?? ""),
      consent: formData.get("consent") === "on",
      [HONEYPOT_FIELD]: String(formData.get(HONEYPOT_FIELD) ?? ""),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? "Something went wrong. Please try again.",
        );
      }

      setSubmitted(true);
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
    <Section id="register" labelledBy="register-heading">
      <div className="mx-auto max-w-3xl">
        <SectionIntro
          id="register-heading"
          eyebrow="Registration"
          title="Register for Our Upcoming Events"
          intro="Secure your place in the ETEN community and get access to exclusive sessions."
          center
        />
        <div className="border-brand-100 bg-lavender mt-12 rounded-[2rem] border p-6 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-8 md:p-12">
          {submitted ? (
            <div
              role="status"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <CheckCircle2 aria-hidden className="text-brand-600 size-14" />
              <h3 className="font-jakarta text-brand-950 text-2xl font-bold">
                You&apos;re registered. See you there.
              </h3>
              <p className="text-ink/75 max-w-md">
                We&apos;ll email you the session details and joining
                instructions ahead of the event.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Honeypot: hidden from real users, off-screen (not display:none
                    so bots still autofill it). A filled value flags a bot. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: 0,
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                }}
              >
                <label htmlFor={HONEYPOT_FIELD}>
                  Company URL (leave this empty)
                </label>
                <input
                  id={HONEYPOT_FIELD}
                  name={HONEYPOT_FIELD}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </div>
              {/* About You */}
              <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <legend className="text-brand-600 col-span-full mb-1 text-xs font-bold tracking-[0.2em] uppercase">
                  About You
                </legend>
                <div className="space-y-2">
                  <label htmlFor="firstName" className={labelClasses}>
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="John"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className={labelClasses}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className={labelClasses}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className={labelClasses}>
                    Phone / WhatsApp Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="country" className={labelClasses}>
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    defaultValue=""
                    className={fieldClasses}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className={labelClasses}>
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Lagos"
                    className={fieldClasses}
                  />
                </div>
              </fieldset>

              {/* Professional Profile */}
              <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <legend className="text-brand-600 col-span-full mb-1 text-xs font-bold tracking-[0.2em] uppercase">
                  Professional Profile
                </legend>
                <div className="space-y-2">
                  <label htmlFor="jobTitle" className={labelClasses}>
                    Job Title / Professional Role
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    placeholder="Cloud Solutions Architect"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="organization" className={labelClasses}>
                    Organization / Company
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    placeholder="Acme Corp"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="areaOfExpertise" className={labelClasses}>
                    Area of Expertise
                  </label>
                  <select
                    id="areaOfExpertise"
                    name="areaOfExpertise"
                    defaultValue=""
                    className={fieldClasses}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {expertiseAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {/* ETEN Membership */}
              <fieldset className="space-y-3">
                <legend className="text-brand-600 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
                  ETEN Membership Status
                </legend>
                <div className="flex flex-wrap gap-4">
                  {membershipOptions.map((option) => (
                    <label
                      key={option}
                      className="border-brand-100 text-ink/80 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-900 has-focus-visible:ring-brand-200 flex cursor-pointer items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors has-focus-visible:ring-4"
                    >
                      <input
                        type="radio"
                        name="membershipStatus"
                        value={option}
                        className="accent-brand-700"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Discovery */}
              <fieldset className="space-y-3">
                <legend className="text-brand-600 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
                  How Did You Hear About This Event?
                </legend>
                <div className="flex flex-wrap gap-4">
                  {heardFromOptions.map((option) => (
                    <label
                      key={option}
                      className="border-brand-100 text-ink/80 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-900 has-focus-visible:ring-brand-200 flex cursor-pointer items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors has-focus-visible:ring-4"
                    >
                      <input
                        type="checkbox"
                        name="heardFrom"
                        value={option}
                        className="accent-brand-700"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Goals */}
              <fieldset className="space-y-2">
                <legend className="text-brand-600 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
                  Your Goals
                </legend>
                <label htmlFor="learningGoals" className={labelClasses}>
                  What do you hope to learn from this session?
                </label>
                <textarea
                  id="learningGoals"
                  name="learningGoals"
                  rows={4}
                  placeholder="Tell us what you're hoping to take away…"
                  className={`${fieldClasses} resize-y`}
                />
              </fieldset>

              {/* Consent */}
              <label className="text-ink/75 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="consent"
                  className="accent-brand-700 mt-1 size-4 shrink-0"
                />
                <span>
                  I agree to receive updates about future ETEN events, webinars
                  and technology opportunities.
                </span>
              </label>

              <div className="pt-2">
                {error && (
                  <p
                    role="alert"
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  >
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-700 hover:bg-brand-600 focus-visible:outline-brand-500 flex min-h-13 w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(100,38,220,0.8)] transition focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && (
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                  )}
                  {submitting ? "Registering…" : "Register for Event"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
