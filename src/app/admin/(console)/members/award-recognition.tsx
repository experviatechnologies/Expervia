"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BADGES } from "@/lib/eten/recognition-types";
import { addMemberRecognition } from "./actions";

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-2.5 text-sm text-eten-ink outline-none focus:border-eten-accent";

/** Ops control to award a badge or an Expert Score credit to a member. */
export function AwardRecognition({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"badge" | "score_credit">("badge");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await addMemberRecognition({
        memberId,
        kind,
        badgeKey: String(fd.get("badgeKey") ?? ""),
        points: kind === "score_credit" ? Number(fd.get("points")) : undefined,
        label: String(fd.get("label") ?? ""),
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
        <Award className="size-3.5" />
        Award recognition
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-eten-line bg-eten-panel-hi mt-2 flex flex-col gap-3 rounded-xl border p-4"
    >
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as typeof kind)}
        className={fieldClass}
      >
        <option value="badge">Badge</option>
        <option value="score_credit">Expert Score credit</option>
      </select>

      {kind === "badge" ? (
        <select name="badgeKey" defaultValue="" required className={fieldClass}>
          <option value="" disabled>
            Choose a badge…
          </option>
          {BADGES.map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name="points"
          type="number"
          required
          placeholder="Points (e.g. 50)"
          className={fieldClass}
        />
      )}

      <input
        name="label"
        placeholder={
          kind === "badge"
            ? "Note (optional — defaults to the badge name)"
            : "Reason (required, e.g. Completed a Circle)"
        }
        required={kind === "score_credit"}
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
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Award"}
        </Button>
      </div>
    </form>
  );
}
