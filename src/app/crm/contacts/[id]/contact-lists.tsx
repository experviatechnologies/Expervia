"use client";

/**
 * Which fixed lists this contact is on, with a checkbox to add or remove
 * them. Smart lists aren't shown here: people join those automatically.
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setListMembership } from "@/app/crm/lists/actions";

export function ContactLists({
  contactId,
  lists,
  memberOf,
}: {
  contactId: string;
  lists: { id: string; name: string }[];
  memberOf: string[];
}) {
  const [on, setOn] = useState(() => new Set(memberOf));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(listId: string, member: boolean) {
    setError(null);
    setBusy(listId);
    start(async () => {
      const res = await setListMembership({ listId, contactId, member });
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOn((prev) => {
        const next = new Set(prev);
        if (member) next.add(listId);
        else next.delete(listId);
        return next;
      });
    });
  }

  if (lists.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        There are no fixed lists yet.{" "}
        <Link
          href="/crm/lists"
          className="text-brand-700 font-semibold hover:underline"
        >
          Create one
        </Link>{" "}
        to start adding people.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {lists.map((l) => {
          const checked = on.has(l.id);
          return (
            <li key={l.id} className="flex items-center gap-2.5 text-sm">
              <input
                id={`list-${l.id}`}
                type="checkbox"
                checked={checked}
                disabled={busy !== null}
                onChange={(e) => toggle(l.id, e.target.checked)}
                className="accent-brand-700 size-4"
              />
              <label htmlFor={`list-${l.id}`} className="text-ink flex-1">
                {l.name}
              </label>
              {busy === l.id && (
                <Loader2
                  aria-label="Saving"
                  className="text-brand-500 size-4 animate-spin"
                />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Smart lists include people automatically when they match.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
