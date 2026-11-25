"use client";

/** Edit and delete a list, and remove someone from a fixed list. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import type { Owner } from "@/lib/crm/record";
import { Card } from "@/components/crm/ui";
import { ListBuilder } from "../list-builder";
import { deleteList, setListMembership } from "../actions";

const btn =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50";

export function ListControls({
  listId,
  listName,
  initial,
  options,
}: {
  listId: string;
  listName: string;
  initial: {
    name: string;
    description: string;
    kind: "smart" | "fixed";
    filters: Record<string, string>;
  };
  options: { sources: string[]; tags: string[]; owners: Owner[] };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteList(listId);
      if (res.ok) router.push("/crm/lists");
      else setError(res.error);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing(true)} className={btn}>
          <Pencil aria-hidden className="text-brand-600 size-4" />
          Edit list
        </button>
        {confirming ? (
          <span
            role="alertdialog"
            aria-label="Confirm delete"
            className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-900"
          >
            Delete “{listName}”? The people stay in the CRM.
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={remove}
              className="inline-flex items-center gap-1 rounded-md bg-rose-700 px-2.5 py-1 font-semibold text-white hover:bg-rose-800"
            >
              {pending && (
                <Loader2 aria-hidden className="size-3.5 animate-spin" />
              )}
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 font-semibold hover:bg-rose-100"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={btn}
          >
            <Trash2 aria-hidden className="size-4 text-rose-600" />
            Delete
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="basis-full text-sm text-rose-700">
          {error}
        </p>
      )}
      {editing && (
        <div className="basis-full">
          <Card title="Edit list">
            <ListBuilder
              listId={listId}
              initial={initial}
              options={options}
              onDone={() => setEditing(false)}
            />
          </Card>
        </div>
      )}
    </>
  );
}

export function RemoveFromList({
  listId,
  contactId,
  name,
}: {
  listId: string;
  contactId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setListMembership({
            listId,
            contactId,
            member: false,
          });
          setError(!res.ok);
        })
      }
      aria-label={`Remove ${name} from this list`}
      title={error ? "Couldn't remove. Try again." : "Remove from list"}
      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <X aria-hidden className={error ? "size-4 text-rose-600" : "size-4"} />
      )}
    </button>
  );
}
