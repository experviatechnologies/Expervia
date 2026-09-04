"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "./actions";

export type PodOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type SkillGroup = {
  podId: string;
  podName: string;
  skills: { id: string; name: string }[];
};

export function OnboardingForm({
  pods,
  skillGroups,
}: {
  pods: PodOption[];
  skillGroups: SkillGroup[];
}) {
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasSkills = skillGroups.some((g) => g.skills.length > 0);

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!selectedPodId) {
      setError("Please choose your primary pod to continue.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        primaryPodId: selectedPodId,
        skillIds: Array.from(selectedSkillIds),
      });
      // On success the action redirects; only an error comes back here.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Step 1 — primary pod (required) */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-body-lg text-on-surface font-bold">
            1. Choose your primary pod
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            This is your home specialist community. You can join more pods
            later.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pods.map((pod) => {
            const isSelected = selectedPodId === pod.id;
            return (
              <button
                key={pod.id}
                type="button"
                onClick={() => setSelectedPodId(pod.id)}
                aria-pressed={isSelected}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant hover:border-on-surface-variant/50 bg-surface-container"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-outline-variant"
                  }`}
                >
                  {isSelected && <Check className="size-3.5" />}
                </span>
                <span>
                  <span className="text-on-surface block text-sm font-semibold">
                    {pod.name}
                  </span>
                  {pod.description && (
                    <span className="text-on-surface-variant mt-1 block text-xs leading-relaxed">
                      {pod.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — skills (optional) */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-body-lg text-on-surface font-bold">
            2. Add your skills{" "}
            <span className="text-on-surface-variant text-sm font-normal">
              (optional)
            </span>
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Pick what you work with so peers can find you. These show on your
            profile and you can change them anytime.
          </p>
        </div>

        {hasSkills ? (
          <div className="flex flex-col gap-6">
            {skillGroups
              .filter((g) => g.skills.length > 0)
              .map((group) => (
                <div key={group.podId}>
                  <p className="text-label-sm text-on-surface-variant mb-2 font-mono tracking-wider uppercase">
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
            The skills library is still being set up. You&apos;ll be able to add
            your skills from your profile soon — no need to wait.
          </p>
        )}
      </section>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <span className="text-on-surface-variant mr-auto text-xs">
          {selectedSkillIds.size > 0
            ? `${selectedSkillIds.size} skill${
                selectedSkillIds.size === 1 ? "" : "s"
              } selected`
            : " "}
        </span>
        <Button
          type="button"
          variant="brand"
          size="pill-sm"
          onClick={handleSubmit}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Setting up…
            </>
          ) : (
            "Enter ETEN"
          )}
        </Button>
      </div>
    </div>
  );
}
