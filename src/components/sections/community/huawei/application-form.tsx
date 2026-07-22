"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const solutionAreas = [
  "Cloud & Computing",
  "IP Networking",
  "Storage",
  "Digital Power",
  "Enterprise Wireless",
];

const certifications = ["HCIA", "HCIP", "HCIE", "Other"];

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB — see note in application-form.tsx
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const fieldClasses =
  "w-full rounded-lg border border-outline-variant bg-surface p-4 text-on-surface outline-none transition-all focus:border-brand";

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
    <section id="apply" className="bg-surface-container-low py-section">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <SectionLabel className="mb-4">Application</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg font-bold">
              Apply to Join the Community Today
            </h2>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-8 shadow-xl md:p-12">
            {submitted ? (
              <div
                role="status"
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <CheckCircle2 className="text-primary size-14" />
                <h3 className="font-display text-on-surface text-headline-md font-semibold">
                  Thank you — your application has been received.
                </h3>
                <p className="text-on-surface-variant max-w-md">
                  Our team will review your profile and reach out about next
                  steps.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Personal Information */}
                <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <legend className="text-label-sm text-primary col-span-full mb-2 font-mono tracking-widest uppercase">
                    Personal Information
                  </legend>
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-label-sm text-on-surface-variant font-mono uppercase"
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
                      className="text-label-sm text-on-surface-variant font-mono uppercase"
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
                </fieldset>

                {/* Professional Profile */}
                <fieldset className="space-y-6">
                  <legend className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
                    Professional Profile
                  </legend>
                  <div className="space-y-2">
                    <label
                      htmlFor="solutionArea"
                      className="text-label-sm text-on-surface-variant font-mono uppercase"
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
                    <span className="text-label-sm text-on-surface-variant block font-mono uppercase">
                      Huawei Certifications Held
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {certifications.map((cert) => (
                        <label
                          key={cert}
                          className="border-outline-variant has-checked:border-brand has-checked:bg-brand/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                        >
                          <input
                            type="checkbox"
                            name="certifications"
                            value={cert}
                            className="accent-brand"
                          />
                          {cert}
                        </label>
                      ))}
                    </div>
                  </div>
                </fieldset>

                {/* Document Upload */}
                <fieldset className="space-y-2">
                  <legend className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
                    Document Upload
                  </legend>
                  <label
                    htmlFor="resume"
                    className="border-outline-variant hover:border-brand flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors"
                  >
                    <UploadCloud className="text-primary size-8" />
                    <span className="text-on-surface text-sm font-medium">
                      {fileName ?? "Upload Resume & Certifications"}
                    </span>
                    <span className="text-on-surface-variant text-xs">
                      PDF, JPG or PNG. Max size 4MB.
                    </span>
                    <input
                      id="resume"
                      name="resume"
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </fieldset>

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
                    {submitting
                      ? "Submitting…"
                      : "Apply to Join the Community Today"}
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
