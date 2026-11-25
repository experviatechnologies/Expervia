"use client";

/** Start a campaign: a name and the list it goes to. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Card } from "@/components/crm/ui";
import { createCampaign } from "./actions";

const field =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring-3 focus:ring-brand-100";

export function NewCampaign({
  lists,
}: {
  lists: { id: string; name: string; size: number | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 self-start rounded-lg px-4 text-sm font-semibold text-white sm:self-auto"
      >
        <Plus aria-hidden className="size-4" />
        New campaign
      </button>
    );
  }
  return (
    <div className="basis-full">
      <Card title="New campaign">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const r = await createCampaign({ name, listId: listId || null });
              if (r.ok) router.push(`/crm/campaigns/${r.id}`);
              else setError(r.error);
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label
              htmlFor="nc-name"
              className="mb-1 block text-xs font-semibold text-slate-500"
            >
              Campaign name (only staff see this)
            </label>
            <input
              id="nc-name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. December mentorship launch"
              className={field}
            />
          </div>
          <div>
            <label
              htmlFor="nc-list"
              className="mb-1 block text-xs font-semibold text-slate-500"
            >
              Send to list
            </label>
            {lists.length === 0 ? (
              <p className="text-sm text-slate-600">
                Create a list first, in Lists.
              </p>
            ) : (
              <select
                id="nc-list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className={field}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.size ?? "?"} people)
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending && (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              )}
              Create and write the email
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink hover:bg-brand-50 inline-flex h-10 items-center rounded-lg border border-[#e4e0f0] bg-white px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
