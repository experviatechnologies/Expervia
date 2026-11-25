"use client";

/**
 * Write a campaign email with a live preview. While it is a draft every
 * field can change; once sending has started only the name can.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import {
  deleteCampaign,
  previewCampaign,
  saveCampaign,
  type CampaignDraft,
} from "../actions";

const field =
  "w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500";
const label = "mb-1 block text-xs font-semibold text-slate-500";

export function CampaignEditor({
  id,
  initial,
  lists,
  locked,
}: {
  id: string;
  initial: CampaignDraft;
  lists: { id: string; name: string }[];
  /** Sending has started: content is fixed. */
  locked: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState<CampaignDraft>(initial);
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const set =
    (k: keyof CampaignDraft) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setD({ ...d, [k]: e.target.value });

  // Live preview, a moment after the email's text stops changing.
  const key = JSON.stringify([
    d.subject,
    d.preview,
    d.body,
    d.ctaLabel,
    d.ctaUrl,
  ]);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const out = await previewCampaign(d);
      if (!cancelled) setHtml(out);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function save() {
    setMessage(null);
    start(async () => {
      const r = await saveCampaign(id, d);
      setMessage(
        r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.error },
      );
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className={label}>
              Campaign name
            </label>
            <input
              id="c-name"
              maxLength={120}
              value={d.name}
              onChange={set("name")}
              className={`${field} h-10`}
            />
          </div>
          <div>
            <label htmlFor="c-list" className={label}>
              Send to list
            </label>
            <select
              id="c-list"
              value={d.listId ?? ""}
              onChange={set("listId")}
              disabled={locked}
              className={`${field} h-10`}
            >
              <option value="">Choose a list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="c-subject" className={label}>
            Subject line
          </label>
          <input
            id="c-subject"
            maxLength={150}
            value={d.subject}
            onChange={set("subject")}
            disabled={locked}
            placeholder="e.g. {first_name}, mentorship sign-ups are open"
            className={`${field} h-10`}
          />
        </div>
        <div>
          <label htmlFor="c-preview" className={label}>
            Preview text (shown after the subject in the inbox)
          </label>
          <input
            id="c-preview"
            maxLength={150}
            value={d.preview}
            onChange={set("preview")}
            disabled={locked}
            className={`${field} h-10`}
          />
        </div>
        <div>
          <label htmlFor="c-body" className={label}>
            Message
          </label>
          <textarea
            id="c-body"
            rows={10}
            maxLength={10000}
            value={d.body}
            onChange={set("body")}
            disabled={locked}
            placeholder={
              "Write your message here.\n\nLeave a blank line to start a new paragraph. {first_name} is replaced with each person's first name."
            }
            className={`${field} resize-y py-2`}
          />
          <p className="mt-1 text-xs text-slate-500">
            &ldquo;Hi Ada,&rdquo; is added at the top, and an unsubscribe link
            at the bottom.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-cta" className={label}>
              Button text (optional)
            </label>
            <input
              id="c-cta"
              maxLength={40}
              value={d.ctaLabel}
              onChange={set("ctaLabel")}
              disabled={locked}
              placeholder="e.g. Book a session"
              className={`${field} h-10`}
            />
          </div>
          <div>
            <label htmlFor="c-url" className={label}>
              Button link
            </label>
            <input
              id="c-url"
              type="url"
              maxLength={500}
              value={d.ctaUrl}
              onChange={set("ctaUrl")}
              disabled={locked}
              placeholder="https://"
              className={`${field} h-10`}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {locked ? "Save name" : "Save draft"}
          </button>
          {!locked &&
            (confirmDelete ? (
              <span
                role="alertdialog"
                aria-label="Confirm delete"
                className="inline-flex items-center gap-2 text-sm"
              >
                Delete this draft?
                <button
                  type="button"
                  autoFocus
                  onClick={() =>
                    start(async () => {
                      const r = await deleteCampaign(id);
                      if (r.ok) router.push("/crm/campaigns");
                      else setMessage({ ok: false, text: r.error });
                    })
                  }
                  className="rounded-md bg-rose-700 px-3 py-1 font-semibold text-white hover:bg-rose-800"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-ink inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold hover:bg-rose-50"
              >
                <Trash2 aria-hidden className="size-4 text-rose-600" />
                Delete draft
              </button>
            ))}
          {message && (
            <p
              role={message.ok ? "status" : "alert"}
              className={
                message.ok
                  ? "inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"
                  : "text-sm text-rose-700"
              }
            >
              {message.ok && <Check aria-hidden className="size-4" />}
              {message.text}
            </p>
          )}
        </div>
        {locked && (
          <p className="text-sm text-slate-600">
            This campaign has started sending, so its email can&apos;t change.
            Everyone on it gets the same message.
          </p>
        )}
      </div>

      <div>
        <p className={label}>Preview (as Ada would see it)</p>
        <iframe
          title="Email preview"
          srcDoc={html}
          sandbox=""
          className="h-[40rem] w-full rounded-xl border border-[#ece9f5] bg-white"
        />
      </div>
    </div>
  );
}
