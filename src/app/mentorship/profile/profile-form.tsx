"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateMentorProfile } from "./actions";

export type SkillGroup = {
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
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
        <p className="text-mnt-ink-muted mt-1 text-[13px]">
          Pick the skills you can mentor in. Selected: {selected.size}
        </p>
        <div className="mt-4 flex flex-col gap-5">
          {skillGroups.map((g) => (
            <div key={g.podName}>
              <div className="text-mnt-faint mb-2 font-mono text-[10.5px] tracking-[0.13em] uppercase">
                {g.podName}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.skills.map((s) => {
                  const on = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={on}
                      className={
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors " +
                        (on
                          ? "border-mnt-brand bg-mnt-brand/12 text-mnt-ink"
                          : "border-mnt-line text-mnt-ink-muted hover:text-mnt-ink")
                      }
                    >
                      {on && <Check className="size-3.5" aria-hidden="true" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
