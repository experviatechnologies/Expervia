"use client";

/**
 * Edit a contact's lead status, lifecycle stage, owner and tags. Saving writes
 * one "Contact updated" entry to the timeline describing what changed.
 */
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { LEAD_STATUS_LABEL, LIFECYCLE_LABEL } from "@/lib/crm/labels";
import type { LeadStatus, Lifecycle, Owner } from "@/lib/crm/record";
import { updateContact } from "./actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-500";

export function PropertiesForm({
  contactId,
  initial,
  owners,
}: {
  contactId: string;
  initial: {
    leadStatus: LeadStatus;
    lifecycle: Lifecycle;
    ownerId: string | null;
    tags: string[];
  };
  owners: Owner[];
}) {
  const [leadStatus, setLeadStatus] = useState(initial.leadStatus);
  const [lifecycle, setLifecycle] = useState(initial.lifecycle);
  const [ownerId, setOwnerId] = useState(initial.ownerId ?? "");
  const [tags, setTags] = useState(initial.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const dirty =
    leadStatus !== saved.leadStatus ||
    lifecycle !== saved.lifecycle ||
    (ownerId || null) !== (saved.ownerId ?? null) ||
    tags.join("\u0000") !== saved.tags.join("\u0000");

  function addTag() {
    const t = tagDraft.trim().replace(/\s+/g, " ");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  function save() {
    setMessage(null);
    start(async () => {
      const next = { leadStatus, lifecycle, ownerId: ownerId || null, tags };
      const res = await updateContact({ contactId, ...next });
      if (res.ok) {
        setSaved(next);
        setMessage({ ok: true, text: "Saved" });
      } else {
        setMessage({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="lead-status" className={labelClass}>
          Lead status
        </label>
        <select
          id="lead-status"
          value={leadStatus}
          onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
          className={fieldClass}
        >
          {Object.entries(LEAD_STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="lifecycle" className={labelClass}>
          Lifecycle stage
        </label>
        <select
          id="lifecycle"
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value as Lifecycle)}
          className={fieldClass}
        >
          {Object.entries(LIFECYCLE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="owner" className={labelClass}>
          Owner
        </label>
        <select
          id="owner"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
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
        <label htmlFor="tag-input" className={labelClass}>
          Tags
        </label>
        {tags.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Tags">
            {tags.map((t) => (
              <li
                key={t}
                className="bg-brand-50 text-brand-800 inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-semibold"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  aria-label={`Remove tag ${t}`}
                  className="text-brand-500 hover:bg-brand-100 hover:text-brand-800 rounded-full p-0.5"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          id="tag-input"
          value={tagDraft}
          maxLength={40}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="Type a tag and press Enter"
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Save changes
        </button>
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
    </div>
  );
}
