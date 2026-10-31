"use client";

/**
 * Tracker building blocks shared across pages: status pills, deadline badges,
 * meeting summaries, availability verdicts and the invitation response dialog.
 */
import Link from "next/link";
import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/tracker/store";
import {
  FORMAT_LABEL,
  PARTICIPANT_STATUS,
  REQUEST_STATUS,
  type Tone,
} from "@/lib/tracker/labels";
import {
  AVAILABILITY_LABEL,
  type Evaluation,
} from "@/lib/tracker/availability";
import { clientLabel, lookup } from "@/lib/tracker/selectors";
import { dueLabel, fmtRange } from "@/lib/tracker/time";
import type {
  Assignment,
  PresalesRequest,
  RequestStatus,
} from "@/lib/tracker/types";
import { Btn, Dialog, Field, Pill, inputClass, useToast } from "./ui";
import { BASE } from "./shell";

export const requestHref = (id: string, tab?: string) =>
  `${BASE}/requests/${id}${tab ? `?tab=${tab}` : ""}`;

export function StatusPill({ status }: { status: RequestStatus }) {
  const s = REQUEST_STATUS[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function DueBadge({
  due,
  urgentWithin = 6,
}: {
  due: string;
  urgentWithin?: number;
}) {
  const { now } = useSession();
  const d = dueLabel(due, now);
  const soon =
    !d.overdue && new Date(due).getTime() - now < urgentWithin * 3_600_000;
  return (
    <Pill tone={d.overdue ? "danger" : soon ? "warning" : "neutral"}>
      <Clock className="size-3" aria-hidden />
      {d.text}
    </Pill>
  );
}

export function RefLink({ req }: { req: PresalesRequest }) {
  return (
    <Link
      href={requestHref(req.id)}
      className="text-eten-accent text-[12.5px] font-bold tracking-[0.02em] hover:underline"
    >
      {req.ref}
    </Link>
  );
}

/** "Client · Tue, 3 Nov 2026 · 15:00–16:00 WAT" with access-aware client name. */
export function MeetingMeta({
  req,
  showClient = true,
  className,
}: {
  req: PresalesRequest;
  showClient?: boolean;
  className?: string;
}) {
  const { data, me } = useSession();
  return (
    <p className={cn("text-eten-ink-muted text-[13px]", className)}>
      {showClient && <>{clientLabel(data, me, req)} · </>}
      {fmtRange(req.startUtc, req.endUtc, req.timezone)}
    </p>
  );
}

export function FormatPills({ req }: { req: PresalesRequest }) {
  const city =
    req.format !== "online" && req.location
      ? req.location.split(",").pop()?.trim()
      : null;
  return (
    <>
      <Pill>{FORMAT_LABEL[req.format]}</Pill>
      {city && <Pill>{city}</Pill>}
    </>
  );
}

const AV_TONE: Record<Evaluation["state"], Tone> = {
  available: "success",
  partial: "warning",
  unavailable: "neutral",
  conflict: "danger",
  inactive: "neutral",
};

export function AvailabilityVerdict({
  ev,
  compact,
}: {
  ev: Evaluation;
  compact?: boolean;
}) {
  const calendarNote =
    ev.calendar === "free"
      ? "Calendar free"
      : ev.calendar === "busy"
        ? "Calendar busy"
        : ev.calendar === "unverified"
          ? "Calendar unverified"
          : "Declared only";
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* A schedule match with an unchecked calendar is never shown as verified free. */}
        {ev.state === "available" && ev.calendar !== "free" ? (
          <Pill tone="info">Available, unverified</Pill>
        ) : (
          <Pill tone={AV_TONE[ev.state]}>{AVAILABILITY_LABEL[ev.state]}</Pill>
        )}
        <span
          className={cn(
            "text-[12px] font-semibold",
            ev.calendar === "free"
              ? "text-eten-verified"
              : ev.calendar === "busy"
                ? "text-trk-danger"
                : "text-eten-faint",
          )}
        >
          {calendarNote}
        </span>
      </div>
      {!compact && (ev.blockers.length > 0 || ev.warnings.length > 0) && (
        <ul className="mt-1.5 space-y-0.5 text-[12.5px]">
          {ev.blockers.map((b) => (
            <li key={b} className="text-trk-danger">
              {b}
            </li>
          ))}
          {ev.warnings.map((w) => (
            <li key={w} className="text-eten-faint">
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ParticipantPill({ a }: { a: Assignment }) {
  const s = PARTICIPANT_STATUS[a.status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

/** Accept / decline an invitation (PRD FR-019). */
export function RespondDialog({
  assignment,
  onClose,
}: {
  assignment: Assignment | null;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  if (!assignment) return null;
  const req = t.data.requests.find((r) => r.id === assignment.requestId)!;
  const L = lookup(t.data);
  const close = () => {
    setDeclining(false);
    setReason("");
    onClose();
  };
  return (
    <Dialog
      open
      onClose={close}
      title={`Invitation: ${req.title}`}
      description={`${req.ref} · ${fmtRange(req.startUtc, req.endUtc, t.me.timezone)}`}
      footer={
        declining ? (
          <>
            <Btn onClick={() => setDeclining(false)}>Back</Btn>
            <Btn
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                t.respond(assignment.id, false, reason.trim());
                toast(
                  "Invitation declined. The Sales Manager and your Pod Leader have been told.",
                );
                close();
              }}
            >
              Decline invitation
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="danger" onClick={() => setDeclining(true)}>
              Decline
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                t.respond(assignment.id, true);
                toast(
                  "Invitation accepted. You will be told when the meeting is confirmed.",
                );
                close();
              }}
            >
              Accept
            </Btn>
          </>
        )
      }
    >
      {declining ? (
        <Field
          label="Reason for declining"
          required
          hint="Shared with the Sales Manager and your Pod Leader so they can find a replacement."
        >
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
      ) : (
        <div className="space-y-3 text-[14px]">
          <p>
            <span className="text-eten-faint">Meeting type: </span>
            {L.meetingType(req.meetingTypeId)} · {FORMAT_LABEL[req.format]}
            {req.location && ` · ${req.location}`}
          </p>
          <p>{req.objective}</p>
          <p>
            <span className="text-eten-faint">Skills: </span>
            {req.skillIds.map(L.skillName).join(", ")}
          </p>
          {req.prepNotes && (
            <p>
              <span className="text-eten-faint">Preparation: </span>
              {req.prepNotes}
            </p>
          )}
          <p className="text-eten-faint text-[13px]">
            Respond by{" "}
            {new Date(assignment.dueAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . Accepting does not confirm the meeting until every required
            participant accepts and checks pass.
          </p>
        </div>
      )}
    </Dialog>
  );
}

export function BarList({
  rows,
  max,
}: {
  rows: { label: string; value: number }[];
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-[13.5px]">
            <span className="truncate">{r.label}</span>
            <span className="font-bold tabular-nums">{r.value}</span>
          </div>
          <div className="bg-eten-line-soft mt-1 h-2 overflow-hidden rounded-full">
            <div
              className="bg-eten-accent h-full rounded-full"
              style={{ width: `${(r.value / top) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
