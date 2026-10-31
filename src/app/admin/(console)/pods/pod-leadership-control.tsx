"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, ShieldCheck } from "lucide-react";
import { setPodLeader } from "./actions";

type Person = { id: string; name: string; headline: string | null };
type Slot = "lead" | "co_lead";

const SLOT: Record<Slot, { title: string; help: string; icon: typeof Crown }> =
  {
    lead: {
      title: "Pod Leader",
      help: "Receives presales nomination requests for this pod.",
      icon: Crown,
    },
    co_lead: {
      title: "Backup leader",
      help: "Can nominate when the Pod Leader is away.",
      icon: ShieldCheck,
    },
  };

/**
 * Ops control for a pod's Lead and backup leader (co_lead). Pick from the
 * pod's active roster, give a reason, save. The previous holder of the slot
 * goes back to member.
 */
export function PodLeadershipControl({
  podId,
  current,
  candidates,
}: {
  podId: string;
  current: Partial<Record<Slot, Person>>;
  candidates: Person[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(SLOT) as Slot[]).map((slot) => (
        <SlotEditor
          key={slot}
          podId={podId}
          slot={slot}
          holder={current[slot]}
          candidates={candidates}
        />
      ))}
    </div>
  );
}

function SlotEditor({
  podId,
  slot,
  holder,
  candidates,
}: {
  podId: string;
  slot: Slot;
  holder?: Person;
  candidates: Person[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const meta = SLOT[slot];
  const Icon = meta.icon;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => c.id !== holder?.id)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.headline?.toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [candidates, query, holder]);

  function save(memberId: string | null) {
    setError(null);
    startTransition(async () => {
      const res = await setPodLeader({ podId, slot, memberId, reason });
      if ("error" in res) {
        setError(res.error);
      } else {
        setEditing(false);
        setChoice("");
        setReason("");
        setQuery("");
        router.refresh();
      }
    });
  }

  const inputClass =
    "border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none";

  return (
    <div className="border-eten-line rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eten-faint flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
            <Icon className="size-3.5" aria-hidden /> {meta.title}
          </p>
          <p
            className={
              "mt-1 truncate text-sm font-semibold " +
              (holder ? "text-eten-ink" : "text-amber-600")
            }
          >
            {holder ? holder.name : "Not set"}
          </p>
          <p className="text-eten-faint mt-0.5 text-xs">{meta.help}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-eten-accent shrink-0 text-sm font-semibold hover:underline"
          >
            {holder ? "Change" : "Assign"}
          </button>
        )}
      </div>

      {editing && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (choice) save(choice);
          }}
        >
          <label className="sr-only" htmlFor={`${slot}-search`}>
            Search the pod roster
          </label>
          <input
            id={`${slot}-search`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this pod's members"
            className={inputClass}
          />
          <label className="sr-only" htmlFor={`${slot}-choice`}>
            Choose a member
          </label>
          <select
            id={`${slot}-choice`}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className={inputClass}
            size={Math.min(6, Math.max(2, matches.length))}
          >
            {matches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.headline ? ` · ${c.headline}` : ""}
              </option>
            ))}
          </select>
          {matches.length === 0 && (
            <p className="text-eten-faint text-xs">No active members match.</p>
          )}
          <label className="sr-only" htmlFor={`${slot}-reason`}>
            Reason
          </label>
          <input
            id={`${slot}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (recorded in the audit log)"
            className={inputClass}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {holder && (
              <button
                type="button"
                disabled={busy || reason.trim().length < 3}
                onClick={() => save(null)}
                className="text-destructive mr-auto text-sm font-semibold disabled:opacity-50"
              >
                Remove {holder.name.split(" ")[0]}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="text-eten-ink-muted text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !choice || reason.trim().length < 3}
              className="bg-eten-accent inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
    </div>
  );
}
