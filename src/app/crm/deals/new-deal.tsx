"use client";

/** "New deal" button that opens the deal form in a panel. */
import { useState } from "react";
import { Plus } from "lucide-react";
import type { PipelineId } from "@/lib/crm/pipelines";
import type { Owner } from "@/lib/crm/record";
import { Card } from "@/components/crm/ui";
import { DealForm, emptyDeal } from "./deal-form";

export function NewDeal({
  pipeline,
  owners,
  meId,
}: {
  pipeline: PipelineId;
  owners: Owner[];
  meId: string;
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
        New deal
      </button>
    );
  }
  return (
    <div className="basis-full">
      <Card title="New deal">
        <DealForm
          initial={emptyDeal(pipeline, meId)}
          owners={owners}
          onCancel={() => setOpen(false)}
        />
      </Card>
    </div>
  );
}
