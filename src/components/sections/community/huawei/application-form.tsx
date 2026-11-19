"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";

const solutionAreas = [
  "Cloud & Computing",
  "IP Networking",
  "Storage",
  "Digital Power",
  "Enterprise Wireless",
];

const certifications = ["HCIA", "HCIP", "HCIE", "Other"];

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB; see note in application-form.tsx
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const fieldClasses =
  "w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 shadow-[0_1px_2px_rgba(33,0,93,0.04)] outline-none transition hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Please upload a PDF, JPG, or PNG file.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large. Max size is 4MB.");
      e.target.value = "";
      setFileName(null);
      return;
    }

    setError(null);
    setFileName(file.name);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (!formData.get("resume") || !(formData.get("resume") as File).size) {
      setError("Please upload your resume & certifications.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/huawei", {
        method: "POST",
        body: formData,
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
    <Section id="apply" labelledBy="apply-heading" tone="lavender">
      <div className="mx-auto max-w-3xl">
        <SectionIntro
          id="apply-heading"
          eyebrow="Application"
          title="Apply to Join the Community Today"
          center
        />

        <div className="border-brand-100 mt-12 rounded-[2rem] border bg-white p-6 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-8 md:p-12">
          {submitted ? (
            <div
              role="status"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <CheckCircle2 aria-hidden className="text-brand-600 size-14" />
              <h3 className="font-jakarta text-brand-950 text-2xl font-bold">
                Thank you. Your application has been received.
              </h3>
              <p className="text-ink/75 max-w-md">
                Our team will review your profile and reach out about next
                steps.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Personal Information */}
              <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <legend className="text-brand-600 col-span-full mb-1 text-xs font-bold tracking-[0.2em] uppercase">
                  Personal Information
                </legend>
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="text-brand-950 block text-sm font-semibold"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className={fieldClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-brand-950 block text-sm font-semibold"
                  >
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
                  <label
                    htmlFor="phone"
                    className="text-brand-950 block text-sm font-semibold"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    className={fieldClasses}
                  />
                </div>
              </fieldset>

              {/* Professional Profile */}
              <fieldset className="space-y-6">
                <legend className="text-brand-600 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
                  Professional Profile
                </legend>
                <div className="space-y-2">
                  <label
                    htmlFor="solutionArea"
                    className="text-brand-950 block text-sm font-semibold"
                  >
                    Primary Solution Area
                  </label>
                  <select
                    id="solutionArea"
                    name="solutionArea"
                    required
                    defaultValue=""
                    className={fieldClasses}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {solutionAreas.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <span className="text-brand-950 block text-sm font-semibold">
                    Huawei Certifications Held
                  </span>
                  <div className="flex flex-wrap gap-4">
                    {certifications.map((cert) => (
                      <label
                        key={cert}
                        className="border-brand-100 text-ink/80 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-900 has-focus-visible:ring-brand-200 flex cursor-pointer items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors has-focus-visible:ring-4"
                      >
                        <input
                          type="checkbox"
                          name="certifications"
                          value={cert}
                          className="accent-brand-700"
                        />
                        {cert}
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>

              {/* Document Upload */}
              <fieldset className="space-y-2">
                <legend className="text-brand-600 mb-2 text-xs font-bold tracking-[0.2em] uppercase">
                  Document Upload
                </legend>
                <label
                  htmlFor="resume"
                  className="border-brand-200 hover:border-brand-500 focus-within:border-brand-500 focus-within:ring-brand-500/15 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed bg-white p-8 text-center transition focus-within:ring-4"
                >
                  <UploadCloud aria-hidden className="text-brand-600 size-8" />
                  <span className="text-brand-950 text-sm font-semibold">
                    {fileName ?? "Upload Resume & Certifications"}
                  </span>
                  <span className="text-ink/60 text-xs">
                    PDF, JPG or PNG. Max size 4MB.
                  </span>
                  <input
                    id="resume"
                    name="resume"
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </fieldset>

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
                  {submitting
                    ? "Submitting…"
                    : "Apply to Join the Community Today"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
