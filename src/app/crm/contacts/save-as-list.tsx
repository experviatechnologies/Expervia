"use client";

/** Save the contacts list's current filters as a smart list. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ListPlus, Loader2 } from "lucide-react";
import { createList } from "../lists/actions";

export function SaveAsList({
  filters,
  summary,
}: {
  filters: Record<string, string>;
  summary: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createList({ name, kind: "smart", filters });
      if (res.ok) router.push(`/crm/lists/${res.id}`);
      else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors"
      >
        <ListPlus aria-hidden className="text-brand-600 size-4" />
        Save as list
      </button>
    );
  }
  return (
    <form
      onSubmit={save}
      className="border-brand-200 bg-brand-50 basis-full rounded-xl border p-3"
      aria-label="Save as smart list"
    >
      <p className="text-ink text-sm">
        Save these filters as a smart list:{" "}
        <span className="text-slate-600">{summary}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="save-list-name" className="sr-only">
          List name
        </label>
        <input
          id="save-list-name"
          autoFocus
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          className="text-ink focus:border-brand-400 focus:ring-brand-100 h-10 min-w-0 flex-1 rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm outline-none focus:ring-3 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Save list
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
