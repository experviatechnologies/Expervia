"use client";

/**
 * Choose a group, send yourself a test, then send the next batch (at most
 * 50) after confirming the exact number. Operations staff only.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailVersion, Group, Mode } from "@/lib/crm/activation";
import {
  sendActivationBatch,
  sendTestActivation,
  type BatchResult,
} from "./actions";

const btn =
  "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function SendPanel({
  canSend,
  counts,
  groupLabels,
  batchSize,
}: {
  canSend: boolean;
  /** counts[group][mode] = people who would get that email now */
  counts: Record<Group, Record<Mode, number>>;
  groupLabels: Record<Group, string>;
  batchSize: number;
}) {
  const router = useRouter();
  const [group, setGroup] = useState<Group>("ad_lead");
  const [mode, setMode] = useState<Mode>("first");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [result, setResult] = useState<BatchResult | null>(null);
  const [pending, start] = useTransition();

  const total = counts[group][mode];
  const next = Math.min(total, batchSize);
  const testVersion: EmailVersion = group === "all" ? "general" : group;

  function test() {
    setMessage(null);
    start(async () => {
      const r = await sendTestActivation(testVersion);
      setMessage(
        r.ok
          ? {
              ok: true,
              text: `Test sent to ${r.to}. Its link opens the sign-in page, because your account is already active.`,
            }
          : { ok: false, text: r.error },
      );
    });
  }

  function send() {
    setConfirming(false);
    setMessage(null);
    start(async () => {
      const r = await sendActivationBatch({ group, mode, expected: next });
      setResult(r);
      router.refresh();
    });
  }

  if (!canSend) {
    return (
      <p className="text-sm text-slate-600">
        Only operations staff can send activation emails. You can see the
        numbers and preview the emails here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="act-group"
            className="mb-1 block text-xs font-semibold text-slate-500"
          >
            Who
          </label>
          <select
            id="act-group"
            value={group}
            onChange={(e) => {
              setGroup(e.target.value as Group);
              setConfirming(false);
              setResult(null);
            }}
            className="text-ink focus:border-brand-400 focus:ring-brand-100 h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm outline-none focus:ring-3"
          >
            {(Object.keys(groupLabels) as Group[]).map((g) => (
              <option key={g} value={g}>
                {groupLabels[g]}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 block text-xs font-semibold text-slate-500">
            Which email
          </legend>
          <div className="inline-flex rounded-lg border border-[#e4e0f0] bg-white p-0.5">
            {(
              [
                ["first", "First email"],
                ["reminder", "Reminder"],
              ] as const
            ).map(([m, label]) => (
              <label
                key={m}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                  mode === m
                    ? "bg-brand-700 text-white"
                    : "hover:text-ink text-slate-600",
                )}
              >
                <input
                  type="radio"
                  name="act-mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => {
                    setMode(m);
                    setConfirming(false);
                    setResult(null);
                  }}
                  className="sr-only"
                />
                {label} ({counts[group][m]})
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="text-sm text-slate-700">
        {total === 0 ? (
          mode === "first" ? (
            "Everyone in this group has already had the first email."
          ) : (
            "Nobody in this group is due a reminder (reminders go 7 days after the last email)."
          )
        ) : (
          <>
            <span className="text-ink font-semibold">{total}</span>{" "}
            {total === 1 ? "person" : "people"} would get this. The next batch
            sends to <span className="text-ink font-semibold">{next}</span>.
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={test}
          disabled={pending}
          className={`${btn} text-ink hover:border-brand-300 hover:bg-brand-50 border border-[#e4e0f0] bg-white`}
        >
          <MailCheck aria-hidden className="text-brand-600 size-4" />
          Send me a test
        </button>
        {confirming ? (
          <span
            role="alertdialog"
            aria-label="Confirm sending"
            className="border-brand-200 bg-brand-50 inline-flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
          >
            Send to {next} {next === 1 ? "person" : "people"} now? This
            can&apos;t be undone.
            <button
              type="button"
              autoFocus
              onClick={send}
              className="bg-brand-700 hover:bg-brand-800 rounded-md px-3 py-1 font-semibold text-white"
            >
              Yes, send
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md px-2 py-1 font-semibold text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending || next === 0}
            className={`${btn} bg-brand-700 hover:bg-brand-800 text-white`}
          >
            {pending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden className="size-4" />
            )}
            Send next {next || ""}
          </button>
        )}
      </div>

      {pending && (
        <p role="status" className="text-sm text-slate-600">
          Sending, one email about every second. Keep this page open.
        </p>
      )}
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={
            message.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"
          }
        >
          {message.text}
        </p>
      )}
      {result &&
        (result.ok ? (
          <div
            role="status"
            className="rounded-xl border border-[#ece9f5] bg-[#fbfaff] p-3 text-sm"
          >
            <p className="text-ink font-semibold">
              Sent {result.sent}
              {result.failed.length > 0 &&
                `, ${result.failed.length} failed`}. {result.remaining} left in
              this group.
            </p>
            {result.failed.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-rose-700">
                {result.failed.slice(0, 5).map((f) => (
                  <li key={f.email}>
                    {f.email}: {f.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p role="alert" className="text-sm text-rose-700">
            {result.error}
          </p>
        ))}
    </div>
  );
}
