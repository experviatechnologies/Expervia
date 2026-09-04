"use client";

import { useState, useTransition } from "react";
import { Check, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileInput } from "./actions";

export type PodOption = { id: string; name: string };
export type SkillGroup = {
  podId: string;
  podName: string;
  skills: { id: string; name: string }[];
};

export type ProfileInitial = {
  fullName: string;
  headline: string;
  jobTitle: string;
  location: string;
  industryExperience: string;
  availabilityStatus: string;
  bio: string;
  languages: string[];
  yearsExperience: number | null;
  primaryPodId: string | null;
};

const AVAILABILITY_OPTIONS = [
  "",
  "Open to opportunities",
  "Open to collaboration",
  "Open to mentoring",
  "Not currently available",
];

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm text-on-surface outline-none transition-all focus:border-primary placeholder:text-on-surface-variant/60";
const labelClass = "text-label-sm text-on-surface-variant font-mono uppercase";

export function ProfileForm({
  initial,
  pods,
  skillGroups,
  initialSkillIds,
}: {
  initial: ProfileInitial;
  pods: PodOption[];
  skillGroups: SkillGroup[];
  initialSkillIds: string[];
}) {
  const [form, setForm] = useState(initial);
  const [languagesText, setLanguagesText] = useState(
    initial.languages.join(", "),
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(initialSkillIds),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const hasSkills = skillGroups.some((g) => g.skills.length > 0);

  function set<K extends keyof ProfileInitial>(
    key: K,
    value: ProfileInitial[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleSkill(id: string) {
    setSaved(false);
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);

    const payload: ProfileInput = {
      fullName: form.fullName,
      headline: form.headline,
      jobTitle: form.jobTitle,
      location: form.location,
      industryExperience: form.industryExperience,
      availabilityStatus: form.availabilityStatus,
      bio: form.bio,
      languages: languagesText
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      yearsExperience:
        form.yearsExperience === null ? null : Number(form.yearsExperience),
      primaryPodId: form.primaryPodId,
      skillIds: Array.from(selectedSkillIds),
    };

    startTransition(async () => {
      const result = await updateProfile(payload);
      if ("error" in result) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Basics */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-body-lg text-on-surface mb-5 font-bold">
          Basics
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" className="sm:col-span-2">
            <input
              id="fullName"
              className={fieldClass}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              maxLength={120}
              required
            />
          </Field>
          <Field label="Headline" htmlFor="headline" className="sm:col-span-2">
            <input
              id="headline"
              className={fieldClass}
              placeholder="e.g. Azure Solutions Architect · Cloud & Security"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="Current role / title" htmlFor="jobTitle">
            <input
              id="jobTitle"
              className={fieldClass}
              value={form.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Location" htmlFor="location">
            <input
              id="location"
              className={fieldClass}
              placeholder="City, Country"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              maxLength={120}
            />
          </Field>
        </div>
      </section>

      {/* Professional */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-body-lg text-on-surface mb-5 font-bold">
          Professional
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Years of experience" htmlFor="years">
            <input
              id="years"
              type="number"
              min={0}
              max={70}
              className={fieldClass}
              value={form.yearsExperience ?? ""}
              onChange={(e) =>
                set(
                  "yearsExperience",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label="Availability" htmlFor="availability">
            <select
              id="availability"
              className={fieldClass}
              value={form.availabilityStatus}
              onChange={(e) => set("availabilityStatus", e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "" ? "Not specified" : opt}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Industry experience"
            htmlFor="industry"
            className="sm:col-span-2"
          >
            <input
              id="industry"
              className={fieldClass}
              placeholder="e.g. Financial services, Public sector"
              value={form.industryExperience}
              onChange={(e) => set("industryExperience", e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field
            label="Languages"
            htmlFor="languages"
            hint="Comma-separated"
            className="sm:col-span-2"
          >
            <input
              id="languages"
              className={fieldClass}
              placeholder="English, French, Yoruba"
              value={languagesText}
              onChange={(e) => {
                setLanguagesText(e.target.value);
                setSaved(false);
              }}
            />
          </Field>
          <Field label="About / bio" htmlFor="bio" className="sm:col-span-2">
            <textarea
              id="bio"
              rows={5}
              className={fieldClass}
              placeholder="A short summary of who you are and what you work on."
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={2000}
            />
          </Field>
        </div>
      </section>

      {/* Specialization + skills */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-body-lg text-on-surface mb-1 font-bold">
          Specialization &amp; skills
        </h2>
        <p className="text-on-surface-variant mb-5 text-sm">
          Your primary pod is your home community; skills help peers find you.
        </p>

        <Field label="Primary pod" htmlFor="primaryPod">
          <select
            id="primaryPod"
            className={fieldClass}
            value={form.primaryPodId ?? ""}
            onChange={(e) =>
              set("primaryPodId", e.target.value === "" ? null : e.target.value)
            }
          >
            <option value="">Not specified</option>
            {pods.map((pod) => (
              <option key={pod.id} value={pod.id}>
                {pod.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-6">
          <p className={`${labelClass} mb-3`}>Skills</p>
          {hasSkills ? (
            <div className="flex flex-col gap-5">
              {skillGroups
                .filter((g) => g.skills.length > 0)
                .map((group) => (
                  <div key={group.podId}>
                    <p className="text-on-surface-variant mb-2 text-xs font-medium">
                      {group.podName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill) => {
                        const isOn = selectedSkillIds.has(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            aria-pressed={isOn}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                              isOn
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-on-surface-variant/50"
                            }`}
                          >
                            {isOn && <Check className="size-3.5" />}
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="border-outline-variant text-on-surface-variant rounded-xl border border-dashed p-4 text-sm">
              No skills are available yet. Once the ETEN team adds them, they
              show up here to tag yourself with.
            </p>
          )}
        </div>
      </section>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {saved && !pending && (
          <span className="text-primary inline-flex items-center gap-1.5 text-sm">
            <CircleCheck className="size-4" />
            Saved
          </span>
        )}
        <Button type="submit" variant="brand" size="pill-sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {hint && (
          <span className="text-on-surface-variant/60 ml-2 lowercase">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
