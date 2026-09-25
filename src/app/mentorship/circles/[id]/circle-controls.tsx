"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { V_LEVELS } from "@/lib/eten/v-levels";
import {
  enrolMentee,
  setCircleGoal,
  activateCircle,
  addSession,
  setAttendance,
  postAssignment,
  submitEvidence,
  reviewSubmission,
  completeCircle,
} from "../actions";

const field =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand w-full rounded-[10px] border px-3.5 py-2.5 text-[14px] outline-none";
const btn =
  "bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";

/** Mentor: activate a draft Circle. */
export function ActivateCircleControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-4">
      <button
        type="button"
        className={btn}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await activateCircle({ circleId });
            if ("error" in res) setError(res.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Activating…" : "Activate Circle"}
      </button>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}

/** Mentor: enrol a mentee by email. */
export function EnrolMenteeControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mentee@email.com"
          className={field + " max-w-[260px] flex-1"}
        />
        <button
          type="button"
          className={btn}
          disabled={pending || !email.trim()}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await enrolMentee({ circleId, email });
              if ("error" in res) setError(res.error);
              else {
                setEmail("");
                router.refresh();
              }
            })
          }
        >
          {pending ? "Adding…" : "Add mentee"}
        </button>
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}

/** Mentee: set or update their goal. */
export function SetGoalControl({
  circleId,
  currentVLevel,
  currentCapability,
}: {
  circleId: string;
  currentVLevel: number | null;
  currentCapability: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await setCircleGoal({
        circleId,
        targetVLevel: Number(fd.get("targetVLevel")),
        targetCapability: String(fd.get("targetCapability") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-mnt-panel border-mnt-brand/30 mt-[18px] rounded-2xl border p-[18px]"
    >
      <div className="text-mnt-ink font-display text-[15px] font-bold">
        Your goal
      </div>
      <p className="text-mnt-ink-muted mt-1 text-[12.5px]">
        The readiness level and capability you are working toward. Your mentor
        sees this.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select
          name="targetVLevel"
          required
          defaultValue={currentVLevel ?? ""}
          className={field}
        >
          <option value="" disabled>
            Target V-level…
          </option>
          {V_LEVELS.map((v) => (
            <option key={v.level} value={v.level}>
              V{v.level} · {v.label}
            </option>
          ))}
        </select>
        <input
          name="targetCapability"
          maxLength={160}
          defaultValue={currentCapability ?? ""}
          placeholder="e.g. Azure landing-zone design"
          className={field}
        />
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
      <div className="mt-3">
        <button type="submit" className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save goal"}
        </button>
      </div>
    </form>
  );
}

/** Mentor: log a session (title + date). */
export function AddSessionControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      setError(null);
      const res = await addSession({
        circleId,
        title: String(fd.get("title") ?? ""),
        sessionDate: String(fd.get("sessionDate") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        name="title"
        placeholder="Session title"
        className={field + " max-w-[200px] flex-1"}
      />
      <input name="sessionDate" type="date" className={field + " w-[150px]"} />
      <button type="submit" className={btn} disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="text-destructive w-full text-[12px]">{error}</p>}
    </form>
  );
}

/** Mentor: toggle a mentee's attendance for a session. */
export function AttendanceToggle({
  sessionId,
  memberId,
  attended,
}: {
  sessionId: string;
  memberId: string;
  attended: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setAttendance({ sessionId, memberId, attended: !attended });
          router.refresh();
        })
      }
      className={
        "rounded-full px-2.5 py-1 font-mono text-[10px] transition disabled:opacity-60 " +
        (attended
          ? "bg-mnt-green/14 text-mnt-green"
          : "bg-mnt-panel border-mnt-line text-mnt-faint border")
      }
    >
      {attended ? "Present" : "Absent"}
    </button>
  );
}

/** Mentor: post an assignment. */
export function PostAssignmentControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className={btn} onClick={() => setOpen(true)}>
        + Assignment
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      setError(null);
      const res = await postAssignment({
        circleId,
        title: String(fd.get("title") ?? ""),
        instructions: String(fd.get("instructions") ?? ""),
        dueDate: String(fd.get("dueDate") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else {
        form.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-mnt-panel-2 border-mnt-line mt-3 w-full rounded-xl border p-3"
    >
      <input name="title" placeholder="Assignment title" className={field} />
      <textarea
        name="instructions"
        rows={2}
        placeholder="Instructions (optional)"
        className={field + " mt-2"}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input name="dueDate" type="date" className={field + " w-[150px]"} />
        <button type="submit" className={btn} disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </button>
        <button
          type="button"
          className="text-mnt-faint text-[12px]"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </form>
  );
}

/** Mentee: submit or resubmit evidence. */
export function SubmitEvidenceControl({
  assignmentId,
  status,
  content,
  reviewNote,
}: {
  assignmentId: string;
  status: "submitted" | "approved" | "needs_revision" | null;
  content: string | null;
  reviewNote: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "approved") {
    return (
      <div className="text-mnt-green bg-mnt-green/12 mt-3 rounded-lg px-3 py-2 text-[12px]">
        Approved — added to your capability passport.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await submitEvidence({
        assignmentId,
        content: String(fd.get("content") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      {status === "needs_revision" && reviewNote && (
        <p className="border-mnt-line bg-mnt-panel text-mnt-ink-muted mb-2 rounded-lg border p-2 text-[12px]">
          <span className="text-mnt-ink font-semibold">
            Revision requested:
          </span>{" "}
          {reviewNote}
        </p>
      )}
      <textarea
        name="content"
        rows={3}
        required
        defaultValue={content ?? ""}
        placeholder="Your evidence — describe what you did, or paste a link."
        className={field}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-mnt-faint text-[11.5px]">
          {status === "submitted"
            ? "Submitted — awaiting review."
            : status === "needs_revision"
              ? "Needs revision."
              : "Not submitted yet."}
        </span>
        <button type="submit" className={btn} disabled={pending}>
          {pending ? "…" : status ? "Resubmit" : "Submit evidence"}
        </button>
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </form>
  );
}

/** Mentor: approve a submission or request a revision. */
export function ReviewSubmissionControl({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "needs_revision") {
    startTransition(async () => {
      setError(null);
      const res = await reviewSubmission({ submissionId, decision, note });
      if ("error" in res) setError(res.error);
      else {
        setRevising(false);
        setNote("");
        router.refresh();
      }
    });
  }

  if (revising) {
    return (
      <div className="mt-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What needs changing?"
          className={field}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="border-mnt-line-strong text-mnt-ink rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold"
            onClick={() => setRevising(false)}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-mnt-amber rounded-[10px] px-3 py-1.5 text-[12px] font-bold text-[#241a05]"
            onClick={() => decide("needs_revision")}
            disabled={pending}
          >
            Request revision
          </button>
        </div>
        {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="border-mnt-line-strong text-mnt-ink rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold"
          onClick={() => setRevising(true)}
          disabled={pending}
        >
          Request revision
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => decide("approved")}
          disabled={pending}
        >
          Approve
        </button>
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}

/** Mentor: complete the Circle (awards recognition to graduating mentees). */
export function CompleteCircleControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      setError(null);
      const res = await completeCircle({ circleId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {confirm ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-mnt-ink-muted text-[12.5px]">
            Complete this Circle and award recognition?
          </span>
          <button
            type="button"
            className="border-mnt-line-strong text-mnt-ink rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold"
            onClick={() => setConfirm(false)}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={btn}
            onClick={run}
            disabled={pending}
          >
            {pending ? "Completing…" : "Confirm"}
          </button>
        </div>
      ) : (
        <button type="button" className={btn} onClick={() => setConfirm(true)}>
          Complete Circle
        </button>
      )}
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}
