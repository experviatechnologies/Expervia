"use client";

import { useState } from "react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  TURNSTILE_ENABLED,
  TurnstileWidget,
} from "@/components/shared/turnstile-widget";
import { CheckCircle2, Loader2 } from "lucide-react";

const textFields = [
  {
    id: "fullName",
    label: "Full Name",
    type: "text",
    placeholder: "John Doe",
    required: true,
  },
  {
    id: "email",
    label: "Business Email",
    type: "email",
    placeholder: "john@company.com",
    required: true,
  },
  {
    id: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "+234 800 000 0000",
    required: true,
  },
  {
    id: "organization",
    label: "Organization",
    type: "text",
    placeholder: "Company Name",
    required: true,
  },
  {
    id: "jobTitle",
    label: "Job Title",
    type: "text",
    placeholder: "CTO / Director",
    required: false,
  },
] as const;

const selectFields = [
  {
    id: "industry",
    label: "Industry",
    options: [
      "Healthcare",
      "Financial Services",
      "Government",
      "Energy & Utilities",
      "Other",
    ],
  },
  {
    id: "service",
    label: "Service of Interest",
    options: [
      "AI Implementation",
      "Cloud Migration",
      "Cybersecurity Audit",
      "Microsoft Licensing",
      "Other",
    ],
  },
  {
    id: "budget",
    label: "Project Budget",
    options: ["$50k - $100k", "$100k - $500k", "$500k+", "Not sure yet"],
  },
  {
    id: "timeline",
    label: "Timeline",
    options: ["Immediately", "3-6 Months", "6+ Months"],
  },
] as const;

const fieldClasses =
  "w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 shadow-[0_1px_2px_rgba(33,0,93,0.04)] outline-none transition hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export function ContactForm({ focus }: { focus?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // When the form appeared: bots submit within a second or two.
  const [shownAt] = useState(() => Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          focus,
          elapsedMs: Date.now() - shownAt,
          turnstileToken: captchaToken,
        }),
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
    <div className="border-brand-100 bg-lavender rounded-[2rem] border p-6 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-8 md:p-10">
      <h2 className="font-jakarta text-brand-950 text-2xl font-bold">
        Tell Us About Your Project
      </h2>
      {focus && (
        <p className="border-brand-200 text-brand-800 mt-3 inline-flex rounded-full border bg-white px-3 py-1 text-sm font-semibold">
          Focus: {focus}
        </p>
      )}
      <div className="mb-8" />

      {submitted ? (
        <div
          role="status"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <CheckCircle2 aria-hidden className="text-brand-600 size-14" />
          <h3 className="font-jakarta text-brand-950 text-2xl font-bold">
            Thank you. Your inquiry has been logged.
          </h3>
          <p className="text-ink/75 max-w-md">
            Our strategy team will reach out within 24 hours.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {/* Honeypot: off-screen, real visitors never fill it. */}
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
            />
          </div>
          {textFields.map((f) => (
            <div key={f.id} className="space-y-2">
              <label
                htmlFor={f.id}
                className="text-brand-950 block text-sm font-semibold"
              >
                {f.label}
              </label>
              <input
                id={f.id}
                name={f.id}
                type={f.type}
                required={f.required}
                placeholder={f.placeholder}
                className={fieldClasses}
              />
            </div>
          ))}

          {selectFields.map((f) => (
            <div key={f.id} className="space-y-2">
              <label
                htmlFor={f.id}
                className="text-brand-950 block text-sm font-semibold"
              >
                {f.label}
              </label>
              <select
                id={f.id}
                name={f.id}
                className={fieldClasses}
                defaultValue=""
              >
                <option value="" disabled>
                  Select…
                </option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="message"
              className="text-brand-950 block text-sm font-semibold"
            >
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              placeholder="Describe your challenge or goal..."
              className={fieldClasses}
            />
          </div>

          {TURNSTILE_ENABLED && (
            <div className="md:col-span-2">
              <TurnstileWidget onToken={setCaptchaToken} theme="light" />
            </div>
          )}
          <div className="pt-4 md:col-span-2">
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
              {submitting ? "Sending…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
