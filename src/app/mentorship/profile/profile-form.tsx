"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { updateMentorProfile } from "./actions";

export type SkillGroup = {
  podId: string;
  podName: string;
  skills: { id: string; name: string }[];
};

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";

export function MentorProfileForm({
  initialHeadline,
  initialBio,
  initialSelected,
  skillGroups,
}: {
  initialHeadline: string;
  initialBio: string;
  initialSelected: string[];
  skillGroups: SkillGroup[];
}) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );
  const [areaId, setAreaId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flat lookup: skill id -> { name, area } for the selected chips.
  const skillMeta = new Map<string, { name: string; area: string }>();
  for (const g of skillGroups) {
    for (const s of g.skills)
      skillMeta.set(s.id, { name: s.name, area: g.podName });
  }

  const currentArea = skillGroups.find((g) => g.podId === areaId);
  const availableSkills = (currentArea?.skills ?? []).filter(
    (s) => !selected.has(s.id),
  );

  function addSkill() {
    if (!skillId) return;
    setSaved(false);
    setSelected((prev) => new Set(prev).add(skillId));
    setSkillId("");
  }

  function remove(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateMentorProfile({
        headline,
        bio,
        skillIds: [...selected],
      });
      if ("error" in res) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
        <label
          htmlFor="headline"
          className="text-mnt-ink-muted text-[12.5px] font-medium"
        >
          Headline
        </label>
        <input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={160}
          className={inputClass}
          placeholder="e.g. Cloud Solutions Architect · Azure & AWS"
        />

        <label
          htmlFor="bio"
          className="text-mnt-ink-muted mt-4 block text-[12.5px] font-medium"
        >
          About you
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          maxLength={2000}
          className={inputClass}
          placeholder="A short bio: your experience, focus areas, and how you help mentees."
        />
      </div>

      <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
        <div className="text-mnt-ink text-[14px] font-bold">Skills</div>
        {skillGroups.length === 0 ? (
          <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
            The skills library is still being set up. You&apos;ll be able to
            pick the skills you mentor in here once it&apos;s ready.
          </p>
        ) : (
          <>
            <p className="text-mnt-ink-muted mt-1 text-[13px]">
              Choose an area, pick a skill, and add it.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="skill-area"
                  className="text-mnt-ink-muted text-[12.5px] font-medium"
                >
                  Area
                </label>
                <select
                  id="skill-area"
                  value={areaId}
                  onChange={(e) => {
                    setAreaId(e.target.value);
                    setSkillId("");
                  }}
                  className={inputClass}
                >
                  <option value="">Select an area</option>
                  {skillGroups.map((g) => (
                    <option key={g.podId} value={g.podId}>
                      {g.podName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="skill-name"
                  className="text-mnt-ink-muted text-[12.5px] font-medium"
                >
                  Skill
                </label>
                <select
                  id="skill-name"
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  disabled={!areaId}
                  className={inputClass + " disabled:opacity-60"}
                >
                  <option value="">
                    {!areaId
                      ? "Choose an area first"
                      : availableSkills.length
                        ? "Select a skill"
                        : "All added"}
                  </option>
                  {availableSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addSkill}
                disabled={!skillId}
                className="bg-mnt-brand text-mnt-on-brand mt-1.5 shrink-0 rounded-[10px] px-5 py-3 text-[14px] font-bold transition hover:brightness-110 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {selected.size > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {[...selected].map((id) => {
                  const meta = skillMeta.get(id);
                  return (
                    <span
                      key={id}
                      className="border-mnt-brand bg-mnt-brand/12 text-mnt-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]"
                    >
                      {meta?.name ?? "Skill"}
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        aria-label={`Remove ${meta?.name ?? "skill"}`}
                        className="text-mnt-ink-muted hover:text-mnt-ink"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-mnt-faint mt-3 text-[12.5px]">
                No skills added yet.
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand rounded-full px-6 py-2.5 text-[14px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {saved && (
          <span className="text-mnt-green inline-flex items-center gap-1 text-[13px] font-semibold">
            <Check className="size-4" />
            Saved
          </span>
        )}
        {error && <span className="text-destructive text-[13px]">{error}</span>}
      </div>
    </div>
  );
}
