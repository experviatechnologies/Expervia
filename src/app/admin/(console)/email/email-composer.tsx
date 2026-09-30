"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Users, Check, AlertTriangle } from "lucide-react";
import { previewAudience, sendBroadcast, type Audience } from "./actions";

const AUDIENCES: { value: string; label: string }[] = [
  { value: "all", label: "All members" },
  { value: "prospects", label: "Prospects" },
  { value: "validated", label: "Validated members" },
  { value: "mentors", label: "Verified mentors" },
  { value: "mentorship_signups", label: "Mentorship signups" },
  { value: "missing_docs", label: "Members missing documents" },
  { value: "pod", label: "Specific pod" },
  { value: "manual", label: "Manual email list" },
];

const inputClass =
  "bg-eten-panel border-eten-line text-eten-ink focus:border-eten-accent w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors";
const labelClass =
  "text-eten-faint mb-1.5 block font-mono text-[11px] tracking-wider uppercase";

export function EmailComposer({
  pods,
}: {
  pods: { id: string; name: string }[];
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audience, setAudience] = useState("all");
  const [podId, setPodId] = useState(pods[0]?.id ?? "");
  const [manual, setManual] = useState("");

  const [count, setCount] = useState<number | null>(null);
  const [countLabel, setCountLabel] = useState("");
  const [previewing, startPreview] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [sending, startSend] = useTransition();
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolved = (): Audience =>
    (audience === "pod" ? `pod:${podId}` : audience) as Audience;

  function previewFor(aud: Audience) {
    setConfirm(false);
    setError(null);
    startPreview(async () => {
      const res = await previewAudience({ audience: aud, manual });
      if ("error" in res) {
        setError(res.error);
        setCount(null);
      } else {
        setCount(res.count);
        setCountLabel(res.label);
      }
    });
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  function onSend() {
    setError(null);
    setResult(null);
    if (!confirm) {
      previewFor(resolved());
      setConfirm(true);
      return;
    }
    startSend(async () => {
      const res = await sendBroadcast({
        subject,
        body,
        ctaLabel,
        ctaUrl,
        audience: resolved(),
        manual,
      });
      if ("error" in res) {
        setError(res.error);
        setConfirm(false);
      } else {
        setResult({ sent: res.sent, failed: res.failed, total: res.total });
        setConfirm(false);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Compose */}
      <div className="bg-eten-panel border-eten-line rounded-2xl border p-5 sm:p-6">
        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
            placeholder="An update from ETEN"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="body" className={labelClass}>
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className={inputClass}
            placeholder="Write your message. Blank lines start new paragraphs; links become clickable."
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ctaLabel" className={labelClass}>
              Button label (optional)
            </label>
            <input
              id="ctaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className={inputClass}
              placeholder="Open ETEN"
            />
          </div>
          <div>
            <label htmlFor="ctaUrl" className={labelClass}>
              Button URL (optional)
            </label>
            <input
              id="ctaUrl"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className={inputClass}
              placeholder="https://experviatechnologies.com"
            />
          </div>
        </div>
      </div>

      {/* Audience + send */}
      <div className="bg-eten-panel border-eten-line h-fit rounded-2xl border p-5 sm:p-6">
        <label htmlFor="audience" className={labelClass}>
          Send to
        </label>
        <select
          id="audience"
          value={audience}
          onChange={(e) => {
            const v = e.target.value;
            setAudience(v);
            setCount(null);
            setConfirm(false);
            if (v === "pod") previewFor(`pod:${podId}` as Audience);
            else if (v !== "manual") previewFor(v as Audience);
          }}
          className={inputClass}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        {audience === "pod" && (
          <select
            value={podId}
            onChange={(e) => {
              const v = e.target.value;
              setPodId(v);
              previewFor(`pod:${v}` as Audience);
            }}
            className={inputClass + " mt-2"}
            aria-label="Pod"
          >
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {audience === "manual" && (
          <>
            <textarea
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              rows={4}
              className={inputClass + " mt-2"}
              placeholder="Paste emails separated by commas, spaces or new lines."
            />
            <button
              type="button"
              onClick={() => previewFor("manual")}
              disabled={previewing}
              className="border-eten-line text-eten-ink-muted hover:text-eten-ink mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <Users className="size-3.5" />
              Count recipients
            </button>
          </>
        )}

        <div className="text-eten-ink-muted mt-4 flex items-center gap-2 text-sm">
          <Users className="text-eten-faint size-4" />
          {previewing ? (
            "Counting…"
          ) : count == null ? (
            "Recipients: —"
          ) : (
            <span>
              <span className="text-eten-ink font-semibold">{count}</span>{" "}
              recipient{count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {error && (
          <p className="text-destructive mt-3 flex items-start gap-1.5 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        {result ? (
          <div className="border-eten-verified/30 bg-eten-verified-soft mt-4 rounded-xl border p-4">
            <div className="text-eten-verified flex items-center gap-1.5 text-sm font-semibold">
              <Check className="size-4" />
              Sent {result.sent} of {result.total}
              {result.failed > 0 ? ` · ${result.failed} failed` : ""}
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setSubject("");
                setBody("");
                setCtaLabel("");
                setCtaUrl("");
              }}
              className="text-eten-accent mt-2 text-xs font-semibold hover:underline"
            >
              Compose another
            </button>
          </div>
        ) : confirm ? (
          <div className="border-eten-accent/30 bg-eten-accent-soft mt-4 rounded-xl border p-4">
            <p className="text-eten-ink text-sm">
              Send this email to{" "}
              <span className="font-semibold">
                {count ?? "…"} recipient{count === 1 ? "" : "s"}
              </span>
              {countLabel ? ` (${countLabel})` : ""}?
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onSend}
                disabled={sending || !count}
                className="bg-eten-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <Send className="size-4" />
                {sending ? "Sending…" : "Confirm send"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={sending}
                className="text-eten-faint hover:text-eten-ink px-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="bg-eten-accent mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            <Mail className="size-4" />
            Send email
          </button>
        )}
        {!canSend && (
          <p className="text-eten-faint mt-2 text-xs">
            Add a subject and message to send.
          </p>
        )}
      </div>
    </div>
  );
}
