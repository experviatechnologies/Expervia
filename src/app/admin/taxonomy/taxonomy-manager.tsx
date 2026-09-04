"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSkill,
  deleteSkill,
  renameSkill,
  setSkillActive,
} from "./actions";

export type Skill = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type PodBlock = {
  id: string;
  name: string;
  slug: string;
  isMain: boolean;
  skills: Skill[];
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

export function TaxonomyManager({ pods }: { pods: PodBlock[] }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}
      {pods.map((pod) => (
        <PodSection key={pod.id} pod={pod} onError={setError} />
      ))}
    </div>
  );
}

function PodSection({
  pod,
  onError,
}: {
  pod: PodBlock;
  onError: (msg: string | null) => void;
}) {
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    onError(null);
    startTransition(async () => {
      const res = await createSkill({ podId: pod.id, name });
      if ("error" in res) onError(res.error);
      else setNewName("");
    });
  }

  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-body-lg text-on-surface font-bold">
            {pod.name}
            {pod.isMain && (
              <span className="text-on-surface-variant ml-2 text-xs font-normal">
                (main community)
              </span>
            )}
          </h2>
          <p className="text-on-surface-variant text-xs">
            {pod.skills.length} skill{pod.skills.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Add a skill */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`Add a skill to ${pod.name}…`}
          className={inputClass}
          maxLength={80}
        />
        <Button
          type="button"
          variant="brand"
          size="pill-sm"
          onClick={handleAdd}
          disabled={pending || newName.trim().length < 2}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </div>

      {/* Skill list */}
      {pod.skills.length === 0 ? (
        <p className="text-on-surface-variant/70 text-sm">
          No skills yet. Add the ones members should be able to tag themselves
          with.
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {pod.skills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} onError={onError} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SkillRow({
  skill,
  onError,
}: {
  skill: Skill;
  onError: (msg: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: true } | { error: string }>) {
    onError(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) onError(res.error);
      else if (editing) setEditing(false);
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run(() => renameSkill({ skillId: skill.id, name }));
            }
            if (e.key === "Escape") {
              setName(skill.name);
              setEditing(false);
            }
          }}
          autoFocus
          className={inputClass}
          maxLength={80}
        />
      ) : (
        <span className="flex-1">
          <span
            className={`text-sm ${
              skill.isActive
                ? "text-on-surface"
                : "text-on-surface-variant line-through"
            }`}
          >
            {skill.name}
          </span>
          <span className="text-on-surface-variant/50 ml-2 font-mono text-xs">
            {skill.slug}
          </span>
        </span>
      )}

      {editing ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Save name"
            disabled={pending || name.trim().length < 2}
            onClick={() => run(() => renameSkill({ skillId: skill.id, name }))}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel"
            onClick={() => {
              setName(skill.name);
              setEditing(false);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              run(() =>
                setSkillActive({
                  skillId: skill.id,
                  isActive: !skill.isActive,
                }),
              )
            }
            disabled={pending}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              skill.isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-outline-variant text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {skill.isActive ? "Active" : "Hidden"}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Rename skill"
            disabled={pending}
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete skill"
            disabled={pending}
            className="text-on-surface-variant hover:text-destructive"
            onClick={() => {
              if (
                window.confirm(
                  `Delete “${skill.name}”? This also removes it from any member profiles and post tags. To just hide it, use “Active” instead.`,
                )
              ) {
                run(() => deleteSkill({ skillId: skill.id }));
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
}
