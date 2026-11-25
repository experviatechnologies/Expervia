"use client";

/** Create or edit a deal. On create it opens the new deal's page. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { PIPELINES, type PipelineId } from "@/lib/crm/pipelines";
import { TASK_PRIORITY_LABEL } from "@/lib/crm/labels";
import type { Owner } from "@/lib/crm/record";
import { RelatedPicker, type Picked } from "@/components/crm/related-picker";
import { createDeal, updateDeal, type DealInput } from "./actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-500";

export type DealFormValue = Omit<DealInput, "contactId" | "companyId"> & {
  contact: Picked;
  company: Picked;
};

export function emptyDeal(
  pipeline: PipelineId,
  ownerId: string,
): DealFormValue {
  return {
    name: "",
    pipeline,
    stage: PIPELINES[pipeline].stages[0].id,
    amount: "",
    currency: "NGN",
    closeDate: "",
    priority: "medium",
    product: "",
    notes: "",
    ownerId,
    contact: null,
    company: null,
  };
}

export function DealForm({
  dealId,
  initial,
  owners,
  onCancel,
}: {
  dealId?: string;
  initial: DealFormValue;
  owners: Owner[];
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<DealFormValue>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();
  const set =
    (k: keyof DealFormValue) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setV({ ...v, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const { contact, company, ...rest } = v;
    const input: DealInput = {
      ...rest,
      contactId: contact?.id ?? null,
      companyId: company?.id ?? null,
    };
    start(async () => {
      const res = dealId
        ? await updateDeal(dealId, input)
        : await createDeal(input);
      if (!res.ok) setMessage({ ok: false, text: res.error });
      else if (dealId) setMessage({ ok: true, text: "Saved" });
      else router.push(`/crm/deals/${res.id}`);
    });
  }

  const id = (k: string) => `${dealId ?? "new"}-deal-${k}`;
  const stages = PIPELINES[v.pipeline].stages;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={id("name")} className={labelClass}>
            Deal name
          </label>
          <input
            id={id("name")}
            required
            maxLength={160}
            value={v.name}
            onChange={set("name")}
            placeholder="e.g. Zion Netcom: AWS migration"
            className={fieldClass}
          />
        </div>
        {!dealId && (
          <div>
            <label htmlFor={id("pipeline")} className={labelClass}>
              Pipeline
            </label>
            <select
              id={id("pipeline")}
              value={v.pipeline}
              onChange={(e) => {
                const p = e.target.value as PipelineId;
                setV({ ...v, pipeline: p, stage: PIPELINES[p].stages[0].id });
              }}
              className={fieldClass}
            >
              {Object.values(PIPELINES).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {!dealId && (
          <div>
            <label htmlFor={id("stage")} className={labelClass}>
              Stage
            </label>
            <select
              id={id("stage")}
              value={v.stage}
              onChange={set("stage")}
              className={fieldClass}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({Math.round(s.probability * 100)}%)
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor={id("amount")} className={labelClass}>
            Value
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Currency"
              value={v.currency}
              onChange={set("currency")}
              className={`${fieldClass} w-24`}
            >
              <option value="NGN">₦ NGN</option>
              <option value="USD">$ USD</option>
            </select>
            <input
              id={id("amount")}
              inputMode="decimal"
              value={v.amount}
              onChange={set("amount")}
              placeholder="2,500,000"
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor={id("close")} className={labelClass}>
            Expected close date
          </label>
          <input
            id={id("close")}
            type="date"
            value={v.closeDate}
            onChange={set("closeDate")}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("owner")} className={labelClass}>
            Owner
          </label>
          <select
            id={id("owner")}
            value={v.ownerId ?? ""}
            onChange={(e) => setV({ ...v, ownerId: e.target.value || null })}
            className={fieldClass}
          >
            <option value="">No owner</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("priority")} className={labelClass}>
            Priority
          </label>
          <select
            id={id("priority")}
            value={v.priority}
            onChange={set("priority")}
            className={fieldClass}
          >
            {Object.entries(TASK_PRIORITY_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("product")} className={labelClass}>
            Product or service (optional)
          </label>
          <input
            id={id("product")}
            maxLength={120}
            value={v.product}
            onChange={set("product")}
            placeholder="e.g. Microsoft 365 rollout"
            className={fieldClass}
          />
        </div>
        <RelatedPicker
          id={id("company")}
          kind="company"
          label="Company (optional)"
          value={v.company}
          onChange={(company) => setV({ ...v, company })}
        />
        <RelatedPicker
          id={id("contact")}
          kind="contact"
          label="Main contact (optional)"
          value={v.contact}
          onChange={(contact) => setV({ ...v, contact })}
        />
        <div className="sm:col-span-2">
          <label htmlFor={id("notes")} className={labelClass}>
            Notes (optional)
          </label>
          <textarea
            id={id("notes")}
            rows={3}
            maxLength={2000}
            value={v.notes}
            onChange={set("notes")}
            className={`${fieldClass} h-auto resize-y py-2`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !v.name.trim()}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {dealId ? "Save changes" : "Create deal"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-ink hover:bg-brand-50 inline-flex h-10 items-center rounded-lg border border-[#e4e0f0] bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>
        )}
        <p
          role="status"
          aria-live="polite"
          className={
            message?.ok
              ? "inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"
              : "text-sm text-rose-700"
          }
        >
          {message?.ok && <Check aria-hidden className="size-4" />}
          {message?.text}
        </p>
      </div>
    </form>
  );
}
