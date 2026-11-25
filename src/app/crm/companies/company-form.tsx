"use client";

/**
 * Add or edit a company. On create it opens the new company's record; on
 * edit it stays and confirms the save.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { COMPANY_TYPE_LABEL } from "@/lib/crm/labels";
import type { CompanyType } from "@/lib/crm/companies";
import type { Owner } from "@/lib/crm/record";
import { createCompany, updateCompany, type CompanyInput } from "./actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-500";

export const EMPTY_COMPANY: CompanyInput = {
  name: "",
  type: "prospect",
  industry: "",
  domain: "",
  phone: "",
  city: "",
  country: "",
  description: "",
  ownerId: null,
};

export function CompanyForm({
  companyId,
  initial = EMPTY_COMPANY,
  owners,
  onCancel,
}: {
  /** Set when editing an existing company. */
  companyId?: string;
  initial?: CompanyInput;
  owners: Owner[];
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<CompanyInput>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();
  const set =
    (k: keyof CompanyInput) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setV({ ...v, [k]: e.target.value || (k === "ownerId" ? null : "") });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    start(async () => {
      const res = companyId
        ? await updateCompany(companyId, v)
        : await createCompany(v);
      if (!res.ok) {
        setMessage({ ok: false, text: res.error });
      } else if (companyId) {
        setMessage({ ok: true, text: "Saved" });
      } else {
        router.push(`/crm/companies/${res.id}`);
      }
    });
  }

  const id = (k: string) => `${companyId ?? "new"}-company-${k}`;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={id("name")} className={labelClass}>
            Name
          </label>
          <input
            id={id("name")}
            required
            maxLength={120}
            value={v.name}
            onChange={set("name")}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("type")} className={labelClass}>
            Type
          </label>
          <select
            id={id("type")}
            value={v.type}
            onChange={(e) =>
              setV({ ...v, type: e.target.value as CompanyType })
            }
            className={fieldClass}
          >
            {Object.entries(COMPANY_TYPE_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("owner")} className={labelClass}>
            Owner
          </label>
          <select
            id={id("owner")}
            value={v.ownerId ?? ""}
            onChange={set("ownerId")}
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
          <label htmlFor={id("industry")} className={labelClass}>
            Industry
          </label>
          <input
            id={id("industry")}
            maxLength={80}
            value={v.industry}
            onChange={set("industry")}
            placeholder="e.g. Banking"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("domain")} className={labelClass}>
            Website
          </label>
          <input
            id={id("domain")}
            maxLength={120}
            value={v.domain}
            onChange={set("domain")}
            placeholder="acme.com"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("phone")} className={labelClass}>
            Phone
          </label>
          <input
            id={id("phone")}
            type="tel"
            maxLength={40}
            value={v.phone}
            onChange={set("phone")}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("city")} className={labelClass}>
            City
          </label>
          <input
            id={id("city")}
            maxLength={80}
            value={v.city}
            onChange={set("city")}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("country")} className={labelClass}>
            Country
          </label>
          <input
            id={id("country")}
            maxLength={80}
            value={v.country}
            onChange={set("country")}
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id("description")} className={labelClass}>
            Description
          </label>
          <textarea
            id={id("description")}
            maxLength={2000}
            rows={3}
            value={v.description}
            onChange={set("description")}
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
          {companyId ? "Save changes" : "Add company"}
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
