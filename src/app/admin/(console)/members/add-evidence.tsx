"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVIDENCE_CATEGORIES } from "@/lib/eten/evidence-types";
import { addMemberEvidence } from "./actions";

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-2.5 text-sm text-eten-ink outline-none focus:border-eten-accent";

/** Ops control to attest a capability-passport evidence record for a member. */
export function AddEvidence({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const vLevelRaw = fd.get("vLevel");
    setError(null);
    startTransition(async () => {
      const res = await addMemberEvidence({
        memberId,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        category: String(fd.get("category") ?? "other"),
        capabilityArea: String(fd.get("capabilityArea") ?? ""),
        vLevel:
          vLevelRaw === "" || vLevelRaw == null ? null : Number(vLevelRaw),
      });
      if ("error" in res) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="etenOutline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        Add evidence
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-eten-line bg-eten-panel-hi mt-2 flex flex-col gap-3 rounded-xl border p-4"
    >
      <input
        name="title"
        required
        maxLength={200}
        placeholder="Title (what was demonstrated)"
        className={fieldClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" defaultValue="other" className={fieldClass}>
          {EVIDENCE_CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select name="vLevel" defaultValue="" className={fieldClass}>
          <option value="">V-level (optional)</option>
          {[0, 1, 2, 3, 4, 5].map((v) => (
            <option key={v} value={v}>
              V{v}
            </option>
          ))}
        </select>
      </div>
      <input
        name="capabilityArea"
        placeholder="Capability area (optional)"
        className={fieldClass}
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className={fieldClass}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="eten" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}
