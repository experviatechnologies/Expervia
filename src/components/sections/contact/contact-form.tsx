"use client";

import { useState } from "react";
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
  "w-full rounded-lg border border-outline-variant bg-surface p-4 text-on-surface outline-none transition-all focus:border-brand";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    <div className="bg-surface-container-high rounded-2xl p-8 shadow-xl md:p-12">
      <h2 className="font-display text-on-surface text-headline-md mb-8 font-semibold">
        Tell Us About Your Project
      </h2>

      {submitted ? (
        <div
          role="status"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <CheckCircle2 className="text-primary size-14" />
          <h3 className="font-display text-on-surface text-headline-md font-semibold">
            Thank you — your inquiry has been logged.
          </h3>
          <p className="text-on-surface-variant max-w-md">
            Our strategy team will reach out within 24 hours.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {textFields.map((f) => (
            <div key={f.id} className="space-y-2">
              <label
                htmlFor={f.id}
                className="text-label-sm text-on-surface-variant font-mono uppercase"
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
                className="text-label-sm text-on-surface-variant font-mono uppercase"
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
              className="text-label-sm text-on-surface-variant font-mono uppercase"
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

          <div className="pt-4 md:col-span-2">
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
              {submitting ? "Sending…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
