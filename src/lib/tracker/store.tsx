"use client";

/**
 * In-browser demo store for the Phase 1 tracker frontend.
 *
 * Holds the seeded dataset and the signed-in demo persona, persists both to
 * localStorage (per browser, never shared), and exposes the workflow actions
 * the pages call: availability edits, requests, nominations, selection,
 * invitation responses, confirmation, outcomes and administration. Phase 2+
 * swaps these actions for Supabase-backed server actions with the same names.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { evaluateMember } from "./availability";
import { createSeed, DATA_VERSION, slug } from "./seed";
import { HOUR } from "./time";
import { isSales, lookup, podsLedBy } from "./selectors";
import type {
  AvailabilityException,
  CalendarProvider,
  CalendarStatus,
  Member,
  MeetingOutcome,
  Notification,
  Pod,
  Policies,
  PresalesRequest,
  Role,
  Skill,
  TrackerData,
  WeeklyWindow,
  AccountStatus,
} from "./types";

const DATA_KEY = "eten-tracker-demo";
const PERSONA_KEY = "eten-tracker-persona";

export const PERSONAS = [
  {
    id: "p-adaeze",
    blurb: "Updates availability and responds to invitations.",
  },
  {
    id: "p-tunde",
    blurb: "Leads the Cloud & Microsoft Azure pod and nominates engineers.",
  },
  {
    id: "p-ngozi",
    blurb:
      "Creates presales requests, selects participants and confirms meetings.",
  },
  {
    id: "p-femi",
    blurb: "Reviews coverage, response rates and presales activity.",
  },
  {
    id: "p-kemi",
    blurb: "Manages accounts, pods, skills, settings and system health.",
  },
];

export type RequestInput = Omit<
  PresalesRequest,
  | "id"
  | "ref"
  | "status"
  | "createdAt"
  | "activity"
  | "routing"
  | "ownerId"
  | "submittedAt"
> & { podIds: string[]; deadline: string };

let seq = 0;
const nid = (p: string) =>
  `${p}-${Date.now().toString(36)}${(++seq).toString(36)}`;
const nowIso = () => new Date().toISOString();

function load(): TrackerData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrackerData;
      if (parsed.version === DATA_VERSION) return parsed;
    }
  } catch {
    /* storage blocked or corrupt: fall back to a fresh seed */
  }
  return createSeed();
}

function save(data: TrackerData) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: the demo keeps working in memory */
  }
}

type Ctx = ReturnType<typeof useTrackerState>;
const TrackerContext = createContext<Ctx | null>(null);

function useTrackerState() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  // Render-safe clock for "due in", "overdue" and upcoming/past splits;
  // refreshed every minute so countdowns stay current.
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Hydrate from localStorage after mount (the server never sees demo data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(load());
    try {
      setPersonaId(localStorage.getItem(PERSONA_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((fn: (d: TrackerData) => void) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      save(next);
      return next;
    });
  }, []);

  const me = useMemo(
    () =>
      data && personaId
        ? (data.members.find((m) => m.id === personaId) ?? null)
        : null,
    [data, personaId],
  );

  const signIn = useCallback((id: string) => {
    setPersonaId(id);
    try {
      localStorage.setItem(PERSONA_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setPersonaId(null);
    try {
      localStorage.removeItem(PERSONA_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    const fresh = createSeed();
    save(fresh);
    setData(fresh);
  }, []);

  // ------------------------------------------------------------ helpers

  const meId = me?.id ?? "system";

  function notify(d: TrackerData, n: Omit<Notification, "id" | "read" | "at">) {
    d.notifications.unshift({ id: nid("nt"), read: false, at: nowIso(), ...n });
  }
  function log(
    d: TrackerData,
    req: PresalesRequest,
    text: string,
    actor = meId,
  ) {
    req.activity.push({ at: nowIso(), actorId: actor, text });
  }
  function audit(
    d: TrackerData,
    action: string,
    target: string,
    reason?: string,
  ) {
    d.audit.unshift({
      id: nid("au"),
      at: nowIso(),
      actorId: meId,
      action,
      target,
      reason,
    });
  }
  const reqOf = (d: TrackerData, id: string) =>
    d.requests.find((r) => r.id === id);
  const memberOf = (d: TrackerData, id: string) =>
    d.members.find((m) => m.id === id);

  /** Recompute a request's stage from its routing, nominations and team. */
  function restage(d: TrackerData, req: PresalesRequest) {
    if (["draft", "confirmed", "completed", "cancelled"].includes(req.status))
      return;
    const team = d.assignments.filter(
      (a) =>
        a.requestId === req.id &&
        !["replaced", "cancelled", "declined"].includes(a.status),
    );
    if (team.length > 0) {
      const hasConflict = team.some((a) => {
        if (a.status !== "accepted") return false;
        const m = memberOf(d, a.memberId);
        if (!m) return false;
        const ev = evaluateMember(m, { ...req, requestId: req.id }, d);
        return ev.state === "conflict";
      });
      if (hasConflict) req.status = "conflict";
      else if (team.length < req.needed) req.status = "selection";
      else req.status = "awaiting_acceptance";
      return;
    }
    const noms = d.nominations.filter(
      (n) => n.requestId === req.id && n.status === "submitted",
    );
    req.status =
      noms.length > 0
        ? req.status === "selection"
          ? "selection"
          : "nominations_received"
        : "open";
  }

  // ------------------------------------------------------------ availability

  const updateMe = (fn: (m: Member) => void) =>
    update((d) => {
      const m = memberOf(d, meId);
      if (m) fn(m);
    });

  const saveWeekly = (weekly: WeeklyWindow[]) =>
    updateMe((m) => {
      m.weekly = weekly;
      m.reviewedAt = nowIso();
    });

  const markReviewed = () => updateMe((m) => (m.reviewedAt = nowIso()));

  const saveException = (ex: AvailabilityException) =>
    updateMe((m) => {
      const i = m.exceptions.findIndex((e) => e.id === ex.id);
      if (i >= 0) m.exceptions[i] = ex;
      else m.exceptions.push({ ...ex, id: ex.id || nid("x") });
      m.exceptions.sort((a, b) => a.date.localeCompare(b.date));
    });

  const deleteException = (id: string) =>
    updateMe((m) => (m.exceptions = m.exceptions.filter((e) => e.id !== id)));

  const saveProfile = (patch: Partial<Member>) =>
    updateMe((m) => Object.assign(m, patch));

  const setCalendar = (status: CalendarStatus, provider?: CalendarProvider) =>
    updateMe((m) => {
      m.calendar = status;
      m.calendarProvider =
        status === "none"
          ? undefined
          : (provider ?? m.calendarProvider ?? "demo");
    });

  // ------------------------------------------------------------ requests

  function saveRequest(
    input: RequestInput,
    submit: boolean,
    existingId?: string,
  ): string {
    const id = existingId ?? nid("req");
    update((d) => {
      const { podIds, deadline, ...rest } = input;
      const routing = podIds.map((podId) => ({
        podId,
        status: "awaiting" as const,
        deadline,
      }));
      let req = existingId ? reqOf(d, existingId) : undefined;
      if (!req) {
        d.refCounter += 1;
        req = {
          ...rest,
          id,
          ref: `PSR-2026-${String(d.refCounter).padStart(4, "0")}`,
          status: "draft",
          createdAt: nowIso(),
          ownerId: meId,
          routing,
          activity: [],
        };
        d.requests.unshift(req);
        log(d, req, "Created the request");
      } else {
        const keep = new Map(req.routing.map((r) => [r.podId, r]));
        Object.assign(req, rest);
        req.routing = podIds.map(
          (podId) => keep.get(podId) ?? { podId, status: "awaiting", deadline },
        );
        req.routing.forEach((r) => (r.deadline = deadline));
        log(d, req, "Edited the request details");
      }
      if (submit && req.status === "draft") {
        req.status = "open";
        req.submittedAt = nowIso();
        const L = lookup(d);
        log(
          d,
          req,
          `Submitted for nominations and routed to ${req.routing.map((r) => L.pod(r.podId)?.name).join(", ")}`,
        );
        for (const r of req.routing) {
          const pod = L.pod(r.podId);
          if (!pod) continue;
          notify(d, {
            to: pod.leaderId,
            title: `New nomination request: ${req.title}`,
            body: `${req.ref} needs ${req.needed} engineer${req.needed > 1 ? "s" : ""} from ${pod.name}.${req.urgency === "urgent" ? " Urgent." : ""}`,
            action: "Nominate by the deadline.",
            requestId: req.id,
            critical: req.urgency === "urgent",
            dueAt: r.deadline,
          });
        }
      }
    });
    return id;
  }

  const cancelRequest = (id: string, reason: string) =>
    update((d) => {
      const req = reqOf(d, id);
      if (!req) return;
      req.status = "cancelled";
      req.cancelledReason = reason;
      log(d, req, `Cancelled the request: ${reason}`);
      for (const a of d.assignments.filter((x) => x.requestId === id)) {
        if (
          ["invitation_pending", "accepted", "confirmed"].includes(a.status)
        ) {
          a.status = "cancelled";
          notify(d, {
            to: a.memberId,
            title: `Cancelled: ${req.title}`,
            body: `${req.ref} has been cancelled. ${reason}`,
            requestId: id,
            critical: true,
          });
        }
      }
      audit(d, "Cancelled request", req.ref, reason);
    });

  const reschedule = (id: string, startUtc: string, endUtc: string) =>
    update((d) => {
      const req = reqOf(d, id);
      if (!req) return;
      req.startUtc = startUtc;
      req.endUtc = endUtc;
      log(d, req, "Rescheduled the meeting");
      for (const a of d.assignments.filter((x) => x.requestId === id)) {
        if (["accepted", "confirmed"].includes(a.status)) {
          a.status = "invitation_pending";
          a.dueAt = new Date(
            Date.now() + req.responseHours * HOUR,
          ).toISOString();
          a.sync = a.sync === "created" ? "pending" : a.sync;
          notify(d, {
            to: a.memberId,
            title: `Rescheduled: ${req.title}`,
            body: `${req.ref} has moved. Please confirm you can still attend.`,
            action: "Accept or decline the new time.",
            requestId: id,
            critical: true,
            dueAt: a.dueAt,
          });
        }
      }
      if (req.status === "confirmed") req.status = "awaiting_acceptance";
      restage(d, req);
    });

  // ------------------------------------------------------------ nominations

  const nominate = (
    requestId: string,
    podId: string,
    picks: { memberId: string; justification: string }[],
  ) =>
    update((d) => {
      const req = reqOf(d, requestId);
      if (!req) return;
      const L = lookup(d);
      for (const p of picks) {
        if (
          d.nominations.some(
            (n) =>
              n.requestId === requestId &&
              n.memberId === p.memberId &&
              n.status !== "withdrawn",
          )
        )
          continue;
        d.nominations.push({
          id: nid("n"),
          requestId,
          podId,
          memberId: p.memberId,
          byId: meId,
          justification: p.justification,
          status: "submitted",
          at: nowIso(),
        });
        log(d, req, `Nominated ${L.memberName(p.memberId)}`);
      }
      const route = req.routing.find((r) => r.podId === podId);
      if (route) {
        route.status = "nominated";
        route.respondedAt = route.respondedAt ?? nowIso();
      }
      if (req.status === "open") req.status = "nominations_received";
      notify(d, {
        to: req.ownerId,
        title: `Nominations submitted: ${req.title}`,
        body: `${L.pod(podId)?.name} nominated ${picks.length} engineer${picks.length > 1 ? "s" : ""}.`,
        action: "Review candidates.",
        requestId,
        critical: false,
      });
    });

  const noneSuitable = (requestId: string, podId: string, reason: string) =>
    update((d) => {
      const req = reqOf(d, requestId);
      const route = req?.routing.find((r) => r.podId === podId);
      if (!req || !route) return;
      route.status = "none_suitable";
      route.respondedAt = nowIso();
      const L = lookup(d);
      log(d, req, `${L.pod(podId)?.name}: no suitable candidate (${reason})`);
      notify(d, {
        to: req.ownerId,
        title: `No suitable candidate: ${req.title}`,
        body: `${L.pod(podId)?.name}: ${reason}`,
        requestId,
        critical: false,
      });
    });

  const withdrawNomination = (nominationId: string) =>
    update((d) => {
      const n = d.nominations.find((x) => x.id === nominationId);
      const req = n && reqOf(d, n.requestId);
      if (!n || !req) return;
      n.status = "withdrawn";
      log(
        d,
        req,
        `Withdrew the nomination of ${lookup(d).memberName(n.memberId)}`,
      );
      restage(d, req);
    });

  // ------------------------------------------------------------ selection

  const selectParticipants = (
    requestId: string,
    memberIds: string[],
    rationale: string,
    overrideReason?: string,
  ) =>
    update((d) => {
      const req = reqOf(d, requestId);
      if (!req) return;
      const L = lookup(d);
      for (const memberId of memberIds) {
        const nom = d.nominations.find(
          (n) =>
            n.requestId === requestId &&
            n.memberId === memberId &&
            n.status === "submitted",
        );
        if (nom) nom.status = "selected";
        const dueAt = new Date(
          Date.now() + req.responseHours * HOUR,
        ).toISOString();
        d.assignments.push({
          id: nid("a"),
          requestId,
          memberId,
          status: "invitation_pending",
          invitedAt: nowIso(),
          dueAt,
          sync: "not_synced",
          override: !nom,
        });
        log(
          d,
          req,
          `Selected ${L.memberName(memberId)} and sent an invitation`,
        );
        notify(d, {
          to: memberId,
          title: `Invitation: ${req.title}`,
          body: `You have been selected for ${req.ref}. Please accept or decline.`,
          action: "Accept or decline the invitation.",
          requestId,
          critical: true,
          dueAt,
        });
        if (!nom) {
          const m = L.member(memberId);
          const pod = m && L.pod(m.podId);
          if (pod)
            notify(d, {
              to: pod.leaderId,
              title: `Direct selection: ${req.title}`,
              body: `${m!.name} was selected without a nomination. Reason: ${overrideReason}`,
              requestId,
              critical: false,
            });
        }
      }
      if (overrideReason) {
        req.override = { reason: overrideReason, at: nowIso(), byId: meId };
        audit(d, "Authorised nomination override", req.ref, overrideReason);
      }
      if (rationale) req.rationale = rationale;
      audit(d, "Selected participants", req.ref);
      const team = d.assignments.filter(
        (a) =>
          a.requestId === requestId &&
          !["replaced", "cancelled", "declined"].includes(a.status),
      );
      if (team.length >= req.needed) {
        for (const n of d.nominations.filter(
          (x) => x.requestId === requestId && x.status === "submitted",
        ))
          n.status = "not_selected";
      }
      req.status = "selection";
      restage(d, req);
    });

  const respond = (assignmentId: string, accept: boolean, reason?: string) =>
    update((d) => {
      const a = d.assignments.find((x) => x.id === assignmentId);
      const req = a && reqOf(d, a.requestId);
      if (!a || !req) return;
      const L = lookup(d);
      const name = L.memberName(a.memberId);
      a.respondedAt = nowIso();
      if (accept) {
        a.status = "accepted";
        log(d, req, `${name} accepted the invitation`);
        notify(d, {
          to: req.ownerId,
          title: `Invitation accepted: ${req.title}`,
          body: `${name} accepted.`,
          requestId: req.id,
          critical: false,
        });
      } else {
        a.status = "declined";
        a.declineReason = reason;
        log(
          d,
          req,
          `${name} declined the invitation${reason ? `: ${reason}` : ""}`,
        );
        const m = L.member(a.memberId);
        const pod = m && L.pod(m.podId);
        for (const to of [req.ownerId, pod?.leaderId].filter(
          Boolean,
        ) as string[]) {
          notify(d, {
            to,
            title: `Invitation declined: ${req.title}`,
            body: `${name} declined${reason ? `: ${reason}` : "."} A replacement is needed.`,
            action: "Find a replacement.",
            requestId: req.id,
            critical: true,
          });
        }
      }
      restage(d, req);
      if (req.status === "conflict") {
        notify(d, {
          to: req.ownerId,
          title: `Calendar conflict: ${req.title}`,
          body: `${name}'s calendar shows a busy period during the meeting.`,
          action: "Resolve before confirmation.",
          requestId: req.id,
          critical: true,
        });
        notify(d, {
          to: a.memberId,
          title: `Calendar conflict: ${req.title}`,
          body: "Your calendar shows a busy period during this meeting.",
          action: "Resolve before confirmation.",
          requestId: req.id,
          critical: true,
        });
      }
    });

  const replaceParticipant = (assignmentId: string) =>
    update((d) => {
      const a = d.assignments.find((x) => x.id === assignmentId);
      const req = a && reqOf(d, a.requestId);
      if (!a || !req) return;
      const L = lookup(d);
      a.status = "replaced";
      const nom = d.nominations.find(
        (n) => n.requestId === req.id && n.memberId === a.memberId,
      );
      if (nom) nom.status = "replaced";
      notify(d, {
        to: a.memberId,
        title: `Released: ${req.title}`,
        body: `You are no longer needed for ${req.ref}. Thank you.`,
        requestId: req.id,
        critical: false,
      });
      log(
        d,
        req,
        `Released ${L.memberName(a.memberId)} so a replacement can be selected`,
      );
      req.status = "selection";
      restage(d, req);
    });

  const recheck = (requestId: string) =>
    update((d) => {
      const req = reqOf(d, requestId);
      if (!req) return;
      // Demo: a recheck clears simulated busy blocks the member resolved.
      for (const a of d.assignments.filter(
        (x) => x.requestId === requestId && x.status === "accepted",
      )) {
        const m = memberOf(d, a.memberId);
        if (m) {
          const s = new Date(req.startUtc).getTime();
          const e = new Date(req.endUtc).getTime();
          m.busy = m.busy.filter(
            (b) =>
              !(
                new Date(b.startUtc).getTime() < e &&
                s < new Date(b.endUtc).getTime()
              ),
          );
        }
      }
      log(d, req, "Rechecked availability and calendars", "system");
      restage(d, req);
    });

  const confirmMeeting = (requestId: string, manualReason?: string) =>
    update((d) => {
      const req = reqOf(d, requestId);
      if (!req) return;
      for (const a of d.assignments.filter(
        (x) => x.requestId === requestId && x.status === "accepted",
      )) {
        a.status = "confirmed";
        const m = memberOf(d, a.memberId);
        a.sync = m?.calendar === "connected" ? "created" : "manual";
        notify(d, {
          to: a.memberId,
          title: `Confirmed: ${req.title}`,
          body: `${req.ref} is confirmed.${a.sync === "created" ? " A calendar event has been added." : ""}`,
          requestId,
          critical: false,
        });
      }
      req.status = "confirmed";
      req.confirmedAt = nowIso();
      log(
        d,
        req,
        manualReason
          ? `Confirmed the meeting with a manual fallback: ${manualReason}`
          : "Confirmed the meeting and created calendar events",
      );
      audit(d, "Confirmed meeting", req.ref, manualReason);
    });

  const recordOutcome = (
    requestId: string,
    attendance: Record<string, boolean>,
    outcome: Omit<MeetingOutcome, "recordedAt" | "recordedBy">,
  ) =>
    update((d) => {
      const req = reqOf(d, requestId);
      if (!req) return;
      for (const a of d.assignments.filter(
        (x) => x.requestId === requestId && x.status === "confirmed",
      )) {
        a.status = attendance[a.memberId] === false ? "absent" : "attended";
      }
      req.outcome = { ...outcome, recordedAt: nowIso(), recordedBy: meId };
      req.status = "completed";
      log(d, req, "Recorded the meeting outcome");
    });

  // ------------------------------------------------------------ notifications

  const markRead = (id: string) =>
    update((d) => {
      const n = d.notifications.find((x) => x.id === id);
      if (n) n.read = true;
    });
  const markAllRead = () =>
    update((d) =>
      d.notifications
        .filter((n) => n.to === meId)
        .forEach((n) => (n.read = true)),
    );

  // ------------------------------------------------------------ administration

  const updateUser = (
    id: string,
    patch: { roles?: Role[]; status?: AccountStatus; podId?: string },
    reason: string,
  ) =>
    update((d) => {
      const m = memberOf(d, id);
      if (!m) return;
      if (patch.roles && patch.roles.join() !== m.roles.join())
        audit(d, "Changed roles", m.name, reason);
      if (patch.status && patch.status !== m.status)
        audit(d, `Set account ${patch.status}`, m.name, reason);
      Object.assign(m, patch);
    });

  const inviteUser = (input: {
    name: string;
    email: string;
    podId: string;
    roles: Role[];
  }) =>
    update((d) => {
      const code = `ETEN-${String(d.members.length + 1).padStart(4, "0")}`;
      d.members.push(
        blankMember(
          nid("m"),
          code,
          input.name,
          input.email,
          input.podId,
          input.roles,
          "invited",
        ),
      );
      audit(d, "Invited user", input.name);
    });

  const importMembers = (
    rows: { full_name: string; email: string; primary_pod: string }[],
  ) => {
    let created = 0;
    update((d) => {
      for (const r of rows) {
        const pod = d.pods.find(
          (p) => p.code.toLowerCase() === r.primary_pod.toLowerCase(),
        );
        if (
          !pod ||
          d.members.some((m) => m.email.toLowerCase() === r.email.toLowerCase())
        )
          continue;
        const code = `ETEN-${String(d.members.length + 1).padStart(4, "0")}`;
        d.members.push(
          blankMember(
            nid("m"),
            code,
            r.full_name,
            r.email,
            pod.id,
            ["member"],
            "invited",
          ),
        );
        created++;
      }
      audit(
        d,
        "Imported members from CSV",
        `${created} created, ${rows.length - created} skipped`,
      );
    });
  };

  const savePod = (pod: Pod) =>
    update((d) => {
      const i = d.pods.findIndex((p) => p.id === pod.id);
      if (i >= 0) d.pods[i] = pod;
      else d.pods.push({ ...pod, id: pod.id || slug(pod.code) });
      audit(d, i >= 0 ? "Edited pod" : "Added pod", pod.name);
    });

  const saveSkill = (skill: Skill) =>
    update((d) => {
      const i = d.skills.findIndex((s) => s.id === skill.id);
      if (i >= 0) d.skills[i] = skill;
      else d.skills.push({ ...skill, id: skill.id || slug(skill.name) });
      audit(d, i >= 0 ? "Edited skill" : "Added skill", skill.name);
    });

  const saveMeetingType = (name: string) =>
    update((d) => {
      d.meetingTypes.push({ id: slug(name), name, active: true });
      audit(d, "Added meeting type", name);
    });

  const savePolicies = (p: Policies) =>
    update((d) => {
      d.policies = p;
      audit(d, "Updated policies", "Deadlines, hours and integrations");
    });

  const retryJob = (id: string) =>
    update((d) => {
      const j = d.jobs.find((x) => x.id === id);
      if (!j) return;
      j.attempts += 1;
      j.at = nowIso();
      // The demo retry succeeds unless the cause is an expired authorisation.
      if (!/expired/i.test(j.error ?? "")) {
        j.status = "succeeded";
        j.error = undefined;
      }
    });

  return {
    ready: data !== null && now > 0,
    now,
    data: data as TrackerData,
    me,
    signIn,
    signOut,
    reset,
    saveWeekly,
    markReviewed,
    saveException,
    deleteException,
    saveProfile,
    setCalendar,
    saveRequest,
    cancelRequest,
    reschedule,
    nominate,
    noneSuitable,
    withdrawNomination,
    selectParticipants,
    respond,
    replaceParticipant,
    recheck,
    confirmMeeting,
    recordOutcome,
    markRead,
    markAllRead,
    updateUser,
    inviteUser,
    importMembers,
    savePod,
    saveSkill,
    saveMeetingType,
    savePolicies,
    retryJob,
    isSales: isSales(me),
    ledPods: data && me ? podsLedBy(data, me) : [],
  };
}

function blankMember(
  id: string,
  code: string,
  name: string,
  email: string,
  podId: string,
  roles: Role[],
  status: AccountStatus,
): Member {
  return {
    id,
    code,
    name,
    email,
    roles,
    status,
    podId,
    extraPodIds: [],
    seniority: "mid",
    years: 0,
    bio: "",
    skills: [],
    specialisations: [],
    certifications: [],
    industries: [],
    formats: ["online"],
    cities: [],
    willingToTravel: false,
    travelNotes: "",
    timezone: "Africa/Lagos",
    calendar: "none",
    reviewedAt: null,
    lastSignInAt: null,
    weekly: [],
    exceptions: [],
    busy: [],
    prefs: { weeklyReminder: true, meetingReminders: true, digest: false },
  };
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const value = useTrackerState();
  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside <TrackerProvider>");
  return ctx;
}

/** For pages under the signed-in shell, where `me` and `data` are guaranteed. */
export function useSession() {
  const ctx = useTracker();
  return ctx as Ctx & { me: Member };
}
