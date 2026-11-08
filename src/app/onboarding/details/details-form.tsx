"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveMemberDetails } from "./actions";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors aria-[invalid=true]:border-destructive";
const labelClass = "text-label-sm text-on-surface-variant";

type Initial = {
  fullName: string;
  phone: string;
  linkedin: string;
  location: string;
  jobTitle: string;
  yearsExperience: string;
  hasCv: boolean;
};

export function DetailsForm({
  initial,
  next,
}: {
  initial: Initial;
  next: string;
}) {
  const [error, setError] = useState<{ text: string; field?: string } | null>(
    null,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      try {
        const res = await saveMemberDetails(form);
        if ("error" in res) {
          setError({ text: res.error, field: res.field });
          if (res.field) document.getElementById(`d-${res.field}`)?.focus();
          return;
        }
        // A full load so every server check sees the completed details.
        window.location.assign(next);
      } catch {
        setError({ text: "Something went wrong. Please try again." });
      }
    });
  }

  const bad = (f: string) => error?.field === f || undefined;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="glass-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="d-fullName" className={labelClass}>
          Full name
        </label>
        <input
          id="d-fullName"
          name="fullName"
          required
          autoComplete="name"
          defaultValue={initial.fullName}
          aria-invalid={bad("fullName")}
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="d-phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="d-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="+234 803 123 4567"
            defaultValue={initial.phone}
            aria-invalid={bad("phone")}
            aria-describedby="d-phone-help"
            className={inputClass}
          />
          <p id="d-phone-help" className="text-on-surface-variant text-xs">
            WhatsApp-reachable if possible.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="d-location" className={labelClass}>
            Location
          </label>
          <input
            id="d-location"
            name="location"
            required
            autoComplete="address-level2"
            placeholder="Lagos, Nigeria"
            defaultValue={initial.location}
            aria-invalid={bad("location")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <div className="flex flex-col gap-2">
          <label htmlFor="d-jobTitle" className={labelClass}>
            Job title
          </label>
          <input
            id="d-jobTitle"
            name="jobTitle"
            required
            autoComplete="organization-title"
            placeholder="Cloud Engineer"
            defaultValue={initial.jobTitle}
            aria-invalid={bad("jobTitle")}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="d-yearsExperience" className={labelClass}>
            Years of experience
          </label>
          <input
            id="d-yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            required
            defaultValue={initial.yearsExperience}
            aria-invalid={bad("yearsExperience")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="d-linkedin" className={labelClass}>
          LinkedIn profile{" "}
          <span className="normal-case opacity-70">(optional)</span>
        </label>
        <input
          id="d-linkedin"
          name="linkedin"
          type="url"
          autoComplete="url"
          placeholder="https://www.linkedin.com/in/your-name"
          defaultValue={initial.linkedin}
          aria-invalid={bad("linkedin")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="d-cv" className={labelClass}>
          CV{" "}
          {initial.hasCv && (
            <span className="normal-case opacity-70">
              (on file; upload to replace)
            </span>
          )}
        </label>
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors ${
            bad("cv")
              ? "border-destructive"
              : "hover:border-primary border-white/20"
          }`}
        >
          <FileText className="text-primary size-5 shrink-0" aria-hidden />
          <span className="text-on-surface min-w-0 truncate">
            {fileName ??
              (initial.hasCv
                ? "Your CV is on file"
                : "Choose a PDF or Word file (5 MB max)")}
          </span>
          <input
            id="d-cv"
            name="cv"
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-invalid={bad("cv")}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          id="d-consent"
          name="consent"
          type="checkbox"
          required
          aria-invalid={bad("consent")}
          className="accent-primary mt-1 size-4 shrink-0"
        />
        <span className="text-on-surface-variant">
          I agree that my Pod Leaders and the ETEN team may see my phone number,
          CV and these details to contact me and put me forward for community
          and client opportunities. Other members can&apos;t see my phone number
          or CV. I can update them at any time from my profile.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error.text}
        </p>
      )}

      <Button
        type="submit"
        variant="brand"
        size="pill-sm"
        disabled={pending}
        className="w-full sm:w-auto sm:self-end"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving…
          </>
        ) : (
          "Save and continue"
        )}
      </Button>
    </form>
  );
}
