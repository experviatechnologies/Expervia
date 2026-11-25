"use client";

/** "Add company" button that opens the form in a panel above the list. */
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Owner } from "@/lib/crm/record";
import { Card } from "@/components/crm/ui";
import { CompanyForm } from "./company-form";

export function AddCompany({ owners }: { owners: Owner[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 self-start rounded-lg px-4 text-sm font-semibold text-white transition-colors sm:self-auto"
        >
          <Plus aria-hidden className="size-4" />
          Add company
        </button>
      )}
      {open && (
        <div className="basis-full">
          <Card title="Add a company">
            <CompanyForm owners={owners} onCancel={() => setOpen(false)} />
          </Card>
        </div>
      )}
    </>
  );
}
