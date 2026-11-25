"use client";

/** Test to self, then send the next batch after confirming the number. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import {
  sendCampaignBatch,
  sendCampaignTest,
  type CampaignBatchResult,
} from "../actions";

const btn =
  "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function CampaignSend({
  id,
  canSend,
  remaining,
  batchSize,
  problem,
}: {
  id: string;
  canSend: boolean;
  remaining: number;
  batchSize: number;
  /** Why it can't be sent yet (no subject, no list ...), if anything. */
  problem: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [result, setResult] = useState<CampaignBatchResult | null>(null);
  const [pending, start] = useTransition();
  const next = Math.min(remaining, batchSize);

  if (!canSend) {
    return (
      <p className="text-sm text-slate-600">
        Only operations staff can send campaigns.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {problem && (
        <p className="text-sm text-amber-800">Before sending: {problem}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || !!problem}
          onClick={() => {
            setMessage(null);
            start(async () => {
              const r = await sendCampaignTest(id);
              setMessage(
                r.ok
                  ? { ok: true, text: `Test sent to ${r.to}.` }
                  : { ok: false, text: r.error },
              );
            });
          }}
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
              onClick={() => {
                setConfirming(false);
                start(async () => {
                  const r = await sendCampaignBatch(id, next);
                  setResult(r);
                  router.refresh();
                });
              }}
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
            disabled={pending || !!problem || next === 0}
            onClick={() => setConfirming(true)}
            className={`${btn} bg-brand-700 hover:bg-brand-800 text-white`}
          >
            {pending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden className="size-4" />
            )}
            {next === 0 ? "Nobody left to send to" : `Send next ${next}`}
          </button>
        )}
      </div>
      {pending && (
        <p role="status" className="text-sm text-slate-600">
          Working, about one email a second. Keep this page open.
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
          <p role="status" className="text-ink text-sm font-semibold">
            Sent {result.sent}
            {result.failed > 0 &&
              `, ${result.failed} failed (they'll be tried again next batch)`}
            . {result.remaining} left.
          </p>
        ) : (
          <p role="alert" className="text-sm text-rose-700">
            {result.error}
          </p>
        ))}
    </div>
  );
}
