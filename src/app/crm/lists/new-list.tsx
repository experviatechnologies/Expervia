"use client";

/** "New list" button that opens the builder in a panel. */
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Owner } from "@/lib/crm/record";
import { Card } from "@/components/crm/ui";
import { ListBuilder } from "./list-builder";

export function NewList({
  options,
}: {
  options: { sources: string[]; tags: string[]; owners: Owner[] };
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 self-start rounded-lg px-4 text-sm font-semibold text-white transition-colors sm:self-auto"
      >
        <Plus aria-hidden className="size-4" />
        New list
      </button>
    );
  }
  return (
    <div className="basis-full">
      <Card title="New list">
        <ListBuilder options={options} onDone={() => setOpen(false)} />
      </Card>
    </div>
  );
}
