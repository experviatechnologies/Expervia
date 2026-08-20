"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
  "w-full rounded-lg border border-outline-variant bg-surface p-4 text-on-surface outline-none transition-all focus:border-brand";

const labelClasses =
  "text-label-sm text-on-surface-variant font-mono uppercase";

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
    <section id="register" className="bg-surface py-section">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <SectionLabel className="mb-4">Registration</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              Register for Our Upcoming Events
            </h2>
            <p className="text-body-lg text-on-surface-variant mx-auto max-w-xl">
              Secure your place in the ETEN community and get access to
              exclusive sessions.
            </p>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-8 shadow-xl md:p-12">
            {submitted ? (
              <div
                role="status"
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <CheckCircle2 className="text-primary size-14" />
                <h3 className="font-display text-on-surface text-headline-md font-semibold">
                  You&apos;re registered — see you there.
                </h3>
                <p className="text-on-surface-variant max-w-md">
                  We&apos;ll email you the session details and joining
                  instructions ahead of the event.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* About You */}
                <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <legend className="text-label-sm text-primary col-span-full mb-2 font-mono tracking-widest uppercase">
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
                  <legend className="text-label-sm text-primary col-span-full mb-2 font-mono tracking-widest uppercase">
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
                  <legend className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
                    ETEN Membership Status
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    {membershipOptions.map((option) => (
                      <label
                        key={option}
                        className="border-outline-variant has-checked:border-brand has-checked:bg-brand/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                      >
                        <input
                          type="radio"
                          name="membershipStatus"
                          value={option}
                          className="accent-brand"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Discovery */}
                <fieldset className="space-y-3">
                  <legend className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
                    How Did You Hear About This Event?
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    {heardFromOptions.map((option) => (
                      <label
                        key={option}
                        className="border-outline-variant has-checked:border-brand has-checked:bg-brand/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                      >
                        <input
                          type="checkbox"
                          name="heardFrom"
                          value={option}
                          className="accent-brand"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Goals */}
                <fieldset className="space-y-2">
                  <legend className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
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
                <label className="text-on-surface-variant flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="consent"
                    className="accent-brand mt-1 size-4 shrink-0"
                  />
                  <span>
                    I agree to receive updates about future ETEN events,
                    webinars and technology opportunities.
                  </span>
                </label>

                <div className="pt-2">
                  {error && (
                    <p role="alert" className="text-destructive mb-4 text-sm">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand text-brand-foreground primary-glow flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? "Registering…" : "Register for Event"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
