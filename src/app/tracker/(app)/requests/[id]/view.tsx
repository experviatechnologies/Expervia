"use client";

/**
 * Presales request detail: the whole workflow for one client meeting
 * (PRD section 8). Overview, Pod Leader nominations, Sales Manager candidate
 * comparison and selection, team acceptance and confirmation (with conflict
 * rechecks and a recorded manual fallback), the activity history and the
 * meeting outcome.
 */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Ban,
  CalendarClock,
  Check,
  Pencil,
  RefreshCw,
  Send,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/tracker/store";
import {
  canSeeRequest,
  clientLabel,
  engineers,
  has,
  isSales,
  lookup,
  podsLedBy,
  teamSummary,
} from "@/lib/tracker/selectors";
import { evaluateMember, type Evaluation } from "@/lib/tracker/availability";
import {
  ACCESS_LABEL,
  FORMAT_LABEL,
  NOMINATION_STATUS,
  OUTCOME_TAG,
  REQUEST_STATUS,
  ROUTING_STATUS,
  SENIORITY_LABEL,
  SENIORITY_RANK,
  SYNC_STATUS,
} from "@/lib/tracker/labels";
import {
  fmtAgo,
  fmtDateTime,
  fmtRange,
  toMinutes,
  zonedDate,
  zonedTime,
  zonedToUtc,
} from "@/lib/tracker/time";
import type { Member, OutcomeTag, PresalesRequest } from "@/lib/tracker/types";
import {
  Avatar,
  Btn,
  Card,
  DefList,
  Dialog,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Pill,
  Table,
  Tabs,
  Toggle,
  inputClass,
  td,
  th,
  useToast,
} from "@/components/tracker/ui";
import {
  AvailabilityVerdict,
  DueBadge,
  ParticipantPill,
  RespondDialog,
} from "@/components/tracker/bits";
import { BASE } from "@/components/tracker/shell";

type Tab = "overview" | "nominations" | "team" | "activity" | "outcome";

export function RequestDetail({
  id,
  initialTab,
}: {
  id: string;
  initialTab: string;
}) {
  const t = useSession();
  const { data, me } = t;
  const req = data.requests.find((r) => r.id === id);
  const [tab, setTab] = useState<Tab>(
    (["overview", "nominations", "team", "activity", "outcome"].includes(
      initialTab,
    )
      ? initialTab
      : "overview") as Tab,
  );
  const [dialog, setDialog] = useState<"cancel" | "reschedule" | null>(null);
  const toast = useToast();

  if (!req)
    return (
      <EmptyState
        title="Request not found"
        action={<Btn href={`${BASE}/requests`}>Back to requests</Btn>}
      />
    );
  if (!canSeeRequest(data, me, req)) {
    return (
      <EmptyState
        title="You do not have access to this request"
        action={<Btn href={`${BASE}/dashboard`}>Go to dashboard</Btn>}
      >
        Requests are visible to Sales, Management, the Pod Leaders they are
        routed to and selected engineers.
      </EmptyState>
    );
  }

  const sales = isSales(me);
  const owner = sales || req.ownerId === me.id;
  const led = podsLedBy(data, me).map((p) => p.id);
  const leadsRouted = req.routing.some((r) => led.includes(r.podId));
  const terminal = ["completed", "cancelled"].includes(req.status);
  const ts = teamSummary(data, req);
  const noms = data.nominations.filter(
    (n) => n.requestId === req.id && n.status !== "withdrawn",
  );
  const ended = new Date(req.endUtc).getTime() < t.now;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
  ];
  if (sales || leadsRouted || has(me, "management"))
    tabs.push({
      id: "nominations",
      label: "Nominations and selection",
      count: noms.length,
    });
  tabs.push({ id: "team", label: "Team and confirmation", count: ts.selected });
  tabs.push({ id: "activity", label: "Activity" });
  if (["confirmed", "completed"].includes(req.status))
    tabs.push({ id: "outcome", label: "Outcome" });
  const activeTab = tabs.some((x) => x.id === tab) ? tab : "overview";

  return (
    <>
      <PageHeader
        crumb={{
          href:
            sales || has(me, "management")
              ? `${BASE}/requests`
              : leadsRouted
                ? `${BASE}/nominations`
                : `${BASE}/meetings`,
          label:
            sales || has(me, "management")
              ? "Presales Requests"
              : leadsRouted
                ? "Nominations"
                : "Meetings",
        }}
        title={req.title}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-eten-accent font-bold">{req.ref}</span>·
            <span>{clientLabel(data, me, req)}</span>·
            <span>{fmtRange(req.startUtc, req.endUtc, req.timezone)}</span>
          </span>
        }
        actions={
          owner &&
          !terminal && (
            <>
              {req.status === "draft" && (
                <Btn
                  variant="primary"
                  onClick={() => {
                    t.saveRequest(
                      {
                        ...req,
                        podIds: req.routing.map((r) => r.podId),
                        deadline:
                          req.routing[0]?.deadline ?? new Date().toISOString(),
                      },
                      true,
                      req.id,
                    );
                    toast("Submitted. Pod Leaders have been notified.");
                  }}
                >
                  <Send className="size-4" /> Submit for nominations
                </Btn>
              )}
              <Btn href={`${BASE}/requests/new?edit=${req.id}`}>
                <Pencil className="size-4" /> Edit
              </Btn>
              {req.status !== "draft" && (
                <Btn onClick={() => setDialog("reschedule")}>
                  <CalendarClock className="size-4" /> Reschedule
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => setDialog("cancel")}>
                <Ban className="size-4" /> Cancel request
              </Btn>
            </>
          )
        }
      />

      <Stepper req={req} />

      {req.status === "conflict" && (
        <div className="mb-5">
          <Notice
            tone="danger"
            title="A selected participant has a scheduling conflict"
            action={
              activeTab !== "team" ? (
                <Btn size="sm" variant="danger" onClick={() => setTab("team")}>
                  Resolve
                </Btn>
              ) : undefined
            }
          >
            Recheck availability, ask the participant, or request a replacement.
            The meeting cannot be confirmed while a hard conflict remains.
          </Notice>
        </div>
      )}
      {req.status === "awaiting_acceptance" &&
        ts.accepted >= req.needed &&
        owner && (
          <div className="mb-5">
            <Notice
              tone="success"
              title="Every participant has accepted"
              action={
                activeTab !== "team" ? (
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={() => setTab("team")}
                  >
                    Review and confirm
                  </Btn>
                ) : undefined
              }
            >
              Recheck calendars and confirm to create the calendar events.
            </Notice>
          </div>
        )}
      {req.status === "cancelled" && (
        <div className="mb-5">
          <Notice tone="neutral" title="This request was cancelled">
            {req.cancelledReason}
          </Notice>
        </div>
      )}
      {req.status === "confirmed" && ended && owner && (
        <div className="mb-5">
          <Notice
            tone="warning"
            title="This meeting has taken place"
            action={
              <Btn size="sm" onClick={() => setTab("outcome")}>
                Record outcome
              </Btn>
            }
          >
            Record attendance, notes and next steps.
          </Notice>
        </div>
      )}

      <Tabs<Tab>
        label="Request sections"
        tabs={tabs}
        value={activeTab}
        onChange={setTab}
      />

      {activeTab === "overview" && <Overview req={req} />}
      {activeTab === "nominations" && <Nominations req={req} />}
      {activeTab === "team" && <Team req={req} />}
      {activeTab === "activity" && <Activity req={req} />}
      {activeTab === "outcome" && <Outcome req={req} />}

      {dialog === "cancel" && (
        <CancelDialog req={req} onClose={() => setDialog(null)} />
      )}
      {dialog === "reschedule" && (
        <RescheduleDialog req={req} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

// ------------------------------------------------------------------ stepper

function Stepper({ req }: { req: PresalesRequest }) {
  const order = [
    "draft",
    "nominations",
    "selection",
    "acceptance",
    "confirmed",
    "outcome",
  ];
  const at: Record<string, number> = {
    draft: 0,
    open: 1,
    nominations_received: 2,
    selection: 2,
    awaiting_acceptance: 3,
    conflict: 3,
    confirmed: 4,
    completed: 6,
    cancelled: -1,
  };
  const idx = at[req.status];
  const labels = [
    "Draft",
    "Nominations",
    "Selection",
    req.status === "conflict" ? "Conflict resolution" : "Acceptance",
    "Confirmed",
    "Outcome",
  ];
  const s = REQUEST_STATUS[req.status];
  return (
    <div className="border-eten-line bg-eten-panel mb-5 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border px-4 py-3">
      <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2">
        {order.map((key, i) => {
          const done = idx > i;
          const current = idx === i;
          return (
            <li key={key} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border-2 text-[12px] font-bold",
                  done && "border-eten-accent bg-eten-accent text-white",
                  current &&
                    (req.status === "conflict"
                      ? "border-trk-danger text-trk-danger"
                      : "border-eten-accent text-eten-accent"),
                  !done && !current && "border-eten-line text-eten-faint",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[13.5px] font-semibold",
                  current ? "text-eten-ink" : "text-eten-faint",
                )}
              >
                {labels[i]}
              </span>
              {i < order.length - 1 && (
                <span
                  className="bg-eten-line hidden h-px w-6 sm:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex gap-1.5">
        <Pill tone={s.tone}>{s.label}</Pill>
        {req.urgency === "urgent" && <Pill tone="danger">Urgent</Pill>}
        {req.access !== "standard" && (
          <Pill tone="warning">{ACCESS_LABEL[req.access]}</Pill>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ overview

function Overview({ req }: { req: PresalesRequest }) {
  const { data, me } = useSession();
  const L = lookup(data);
  const selected = data.assignments.some(
    (a) =>
      a.requestId === req.id && a.memberId === me.id && a.status !== "replaced",
  );
  const showLink = isSales(me) || selected;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Card title="Meeting details">
          <DefList
            items={[
              ["Client", clientLabel(data, me, req)],
              [
                "Opportunity reference",
                req.opportunityRef || (
                  <span className="text-eten-faint">Not provided</span>
                ),
              ],
              ["Meeting type", L.meetingType(req.meetingTypeId)],
              ["When", fmtRange(req.startUtc, req.endUtc, req.timezone)],
              ["Format", FORMAT_LABEL[req.format]],
              ["Owner", L.memberName(req.ownerId)],
              ["Participants needed", req.needed],
              ["Seniority", SENIORITY_LABEL[req.seniority]],
              ["Access", ACCESS_LABEL[req.access]],
              ["Invitation response time", `${req.responseHours} hours`],
            ]}
          />
          <div className="mt-5">
            <p className="text-eten-faint text-[11.5px] font-bold tracking-[0.08em] uppercase">
              Objective
            </p>
            <p className="mt-1 text-[14.5px]">{req.objective}</p>
          </div>
          <div className="mt-5">
            <p className="text-eten-faint text-[11.5px] font-bold tracking-[0.08em] uppercase">
              Required skills
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {req.skillIds.map((s) => (
                <Pill key={s} tone="brand">
                  {L.skillName(s)}
                </Pill>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Logistics and preparation">
          <DefList
            items={[
              ...(req.format !== "physical"
                ? ([
                    ["Online platform", req.platform || "Not set"],
                    [
                      "Joining link",
                      !req.joinLink ? (
                        <span className="text-eten-faint">Not provided</span>
                      ) : showLink ? (
                        <a
                          href={req.joinLink}
                          className="text-eten-accent underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {req.joinLink}
                        </a>
                      ) : (
                        <span className="text-eten-faint">
                          Shared with selected participants
                        </span>
                      ),
                    ],
                  ] as [string, React.ReactNode][])
                : []),
              ...(req.format !== "online"
                ? ([["Location", req.location]] as [string, React.ReactNode][])
                : []),
              [
                "Technical preparation",
                req.techPrep || <span className="text-eten-faint">None</span>,
              ],
              [
                "Preparation instructions",
                req.prepNotes || <span className="text-eten-faint">None</span>,
              ],
            ]}
          />
        </Card>
      </div>
      <div className="space-y-6">
        <Card
          title="Pod routing"
          description={
            req.routing[0]
              ? `Nomination deadline ${fmtDateTime(req.routing[0].deadline)}`
              : undefined
          }
          action={
            req.routing[0] &&
            ["open", "nominations_received"].includes(req.status) ? (
              <DueBadge due={req.routing[0].deadline} />
            ) : undefined
          }
          bodyClassName=""
        >
          <ul>
            {req.routing.map((r) => (
              <li
                key={r.podId}
                className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-3 last:border-0"
              >
                <span>
                  <span className="font-semibold">{L.pod(r.podId)?.name}</span>
                  <span className="text-eten-faint block text-[12.5px]">
                    Leader: {L.memberName(L.pod(r.podId)?.leaderId ?? "")}
                  </span>
                </span>
                {req.status === "draft" ? (
                  <Pill>Not sent</Pill>
                ) : (
                  <Pill tone={ROUTING_STATUS[r.status].tone}>
                    {ROUTING_STATUS[r.status].label}
                  </Pill>
                )}
              </li>
            ))}
          </ul>
        </Card>
        {req.override && (
          <Card title="Authorised nomination override">
            <p className="text-[14px]">{req.override.reason}</p>
            <p className="text-eten-faint mt-1 text-[12.5px]">
              Recorded {fmtDateTime(req.override.at)} by{" "}
              {L.memberName(req.override.byId)}
            </p>
          </Card>
        )}
        {req.rationale && (
          <Card title="Selection rationale">
            <p className="text-[14px]">{req.rationale}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ nominations

function skillMatch(m: Member, req: PresalesRequest) {
  const held = new Set(m.skills.map((s) => s.skillId));
  return req.skillIds.filter((s) => held.has(s)).length;
}

function Nominations({ req }: { req: PresalesRequest }) {
  const { data, me } = useSession();
  const led = podsLedBy(data, me).filter((p) =>
    req.routing.some((r) => r.podId === p.id),
  );
  return (
    <div className="space-y-6">
      {led.map((pod) => (
        <NominatePanel key={pod.id} req={req} podId={pod.id} />
      ))}
      {(isSales(me) || has(me, "management")) && <Comparison req={req} />}
    </div>
  );
}

function NominatePanel({
  req,
  podId,
}: {
  req: PresalesRequest;
  podId: string;
}) {
  const t = useSession();
  const { data } = t;
  const toast = useToast();
  const L = lookup(data);
  const route = req.routing.find((r) => r.podId === podId)!;
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [noneOpen, setNoneOpen] = useState(false);
  const [noneReason, setNoneReason] = useState("");
  const [showAll, setShowAll] = useState(false);
  const closed = ["draft", "confirmed", "completed", "cancelled"].includes(
    req.status,
  );
  const already = new Set(
    data.nominations
      .filter((n) => n.requestId === req.id && n.status !== "withdrawn")
      .map((n) => n.memberId),
  );

  const candidates = useMemo(() => {
    const rank = {
      available: 0,
      partial: 1,
      conflict: 2,
      unavailable: 3,
      inactive: 4,
    };
    return engineers(data)
      .filter((m) => m.podId === podId || m.extraPodIds.includes(podId))
      .map((m) => ({
        m,
        ev: evaluateMember(m, { ...req, requestId: req.id }, data),
        match: skillMatch(m, req),
      }))
      .sort(
        (a, b) =>
          b.match - a.match ||
          rank[a.ev.state] - rank[b.ev.state] ||
          SENIORITY_RANK[b.m.seniority] - SENIORITY_RANK[a.m.seniority],
      );
  }, [data, podId, req]);

  const list = showAll
    ? candidates
    : candidates.filter((c) => c.match > 0).slice(0, 12);
  const mine = data.nominations.filter(
    (n) =>
      n.requestId === req.id && n.podId === podId && n.status !== "withdrawn",
  );
  const chosen = Object.keys(picked);
  const missingJustification = chosen.some((id) => !picked[id].trim());

  return (
    <Card
      title={`Nominate from ${L.pod(podId)?.name}`}
      description={`Needs ${req.needed} · ${req.skillIds.map(L.skillName).join(", ")} · ${FORMAT_LABEL[req.format]}`}
      action={
        <span className="flex items-center gap-2">
          <Pill tone={ROUTING_STATUS[route.status].tone}>
            {ROUTING_STATUS[route.status].label}
          </Pill>
          {!closed && route.status === "awaiting" && (
            <DueBadge due={route.deadline} />
          )}
        </span>
      }
      bodyClassName=""
    >
      {mine.length > 0 && (
        <div className="border-eten-line border-b px-5 py-3">
          <p className="mb-2 text-[13px] font-bold">Your nominations</p>
          <ul className="space-y-1.5">
            {mine.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center gap-2 text-[14px]"
              >
                <span className="font-semibold">
                  {L.memberName(n.memberId)}
                </span>
                <Pill tone={NOMINATION_STATUS[n.status].tone}>
                  {NOMINATION_STATUS[n.status].label}
                </Pill>
                <span className="text-eten-faint text-[12.5px]">
                  {n.justification}
                </span>
                {n.status === "submitted" && !closed && (
                  <button
                    type="button"
                    className="text-trk-danger ml-auto text-[12.5px] font-semibold"
                    onClick={() => (
                      t.withdrawNomination(n.id),
                      toast("Nomination withdrawn.")
                    )}
                  >
                    Withdraw
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {closed ? (
        <p className="text-eten-faint px-5 py-4 text-[13.5px]">
          Nominations are closed for this request.
        </p>
      ) : (
        <>
          <Table label="Eligible engineers">
            <thead className="border-eten-line border-b">
              <tr>
                <th className={th}>
                  <span className="sr-only">Select</span>
                </th>
                <th className={th}>Engineer</th>
                <th className={th}>Skill match</th>
                <th className={th}>Availability for this meeting</th>
                <th className={th}>Justification</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ m, ev, match }) => {
                const on = m.id in picked;
                const done = already.has(m.id);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-eten-line-soft border-b last:border-0",
                      on && "bg-eten-accent-soft/50",
                    )}
                  >
                    <td className={td}>
                      <input
                        type="checkbox"
                        aria-label={`Nominate ${m.name}`}
                        className="accent-eten-accent size-4"
                        checked={on || done}
                        disabled={done}
                        onChange={(e) =>
                          setPicked((p) => {
                            const next = { ...p };
                            if (e.target.checked) next[m.id] = "";
                            else delete next[m.id];
                            return next;
                          })
                        }
                      />
                    </td>
                    <td className={td}>
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-eten-faint block text-[12.5px]">
                        {SENIORITY_LABEL[m.seniority]} · {m.years} yrs ·{" "}
                        {m.cities.join(", ")}
                      </span>
                    </td>
                    <td className={`${td} text-[13.5px]`}>
                      <span
                        className={cn(
                          "font-bold",
                          match === req.skillIds.length
                            ? "text-eten-verified"
                            : match
                              ? "text-trk-warn"
                              : "text-eten-faint",
                        )}
                      >
                        {match}/{req.skillIds.length}
                      </span>
                      <span className="text-eten-faint block text-[12px]">
                        {m.skills
                          .filter((s) => req.skillIds.includes(s.skillId))
                          .map((s) => L.skillName(s.skillId))
                          .join(", ") || "None"}
                      </span>
                    </td>
                    <td className={td}>
                      <AvailabilityVerdict ev={ev} />
                    </td>
                    <td className={td}>
                      {done ? (
                        <span className="text-eten-faint text-[13px]">
                          Already nominated
                        </span>
                      ) : on ? (
                        <input
                          aria-label={`Why ${m.name}?`}
                          value={picked[m.id]}
                          onChange={(e) =>
                            setPicked((p) => ({ ...p, [m.id]: e.target.value }))
                          }
                          placeholder="Why this engineer?"
                          className={cn(inputClass, "h-9 min-w-[200px]")}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <div className="border-eten-line flex flex-wrap items-center gap-2 border-t px-5 py-3">
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show best matches only"
                : `Show all ${candidates.length} pod members`}
            </Btn>
            <span className="flex-1" />
            {route.status === "awaiting" && (
              <Btn size="sm" onClick={() => setNoneOpen(true)}>
                No suitable candidate
              </Btn>
            )}
            <Btn
              size="sm"
              variant="primary"
              disabled={chosen.length === 0 || missingJustification}
              onClick={() => {
                t.nominate(
                  req.id,
                  podId,
                  chosen.map((memberId) => ({
                    memberId,
                    justification: picked[memberId].trim(),
                  })),
                );
                setPicked({});
                toast(
                  `Nominated ${chosen.length} engineer${chosen.length > 1 ? "s" : ""}. The Sales Manager has been notified.`,
                );
              }}
            >
              Submit {chosen.length || ""} nomination
              {chosen.length === 1 ? "" : "s"}
            </Btn>
          </div>
          {chosen.length > 0 && missingJustification && (
            <p className="text-eten-faint px-5 pb-3 text-[12.5px]">
              Add a short justification for each engineer.
            </p>
          )}
        </>
      )}
      <Dialog
        open={noneOpen}
        onClose={() => setNoneOpen(false)}
        title="No suitable candidate"
        description="The Sales Manager will be told so they can widen the search."
        footer={
          <>
            <Btn onClick={() => setNoneOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              disabled={!noneReason.trim()}
              onClick={() => {
                t.noneSuitable(req.id, podId, noneReason.trim());
                setNoneOpen(false);
                toast("Recorded. The Sales Manager has been notified.");
              }}
            >
              Send
            </Btn>
          </>
        }
      >
        <Field label="Reason" required>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={noneReason}
              onChange={(e) => setNoneReason(e.target.value)}
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
      </Dialog>
    </Card>
  );
}

function Comparison({ req }: { req: PresalesRequest }) {
  const t = useSession();
  const { data, me } = t;
  const toast = useToast();
  const L = lookup(data);
  const [sel, setSel] = useState<string[]>([]);
  const [rationale, setRationale] = useState(req.rationale ?? "");
  const [directOpen, setDirectOpen] = useState(false);
  const canSelect = has(me, "sales_manager") || has(me, "admin");
  const team = data.assignments.filter(
    (a) =>
      a.requestId === req.id &&
      !["replaced", "cancelled", "declined"].includes(a.status),
  );
  const open = req.needed - team.length;
  const selectable =
    !["draft", "confirmed", "completed", "cancelled"].includes(req.status) &&
    open > 0 &&
    canSelect;
  const noms = data.nominations.filter(
    (n) => n.requestId === req.id && n.status !== "withdrawn",
  );
  const evals = useMemo(() => {
    const map = new Map<string, Evaluation>();
    for (const n of noms) {
      const m = L.member(n.memberId);
      if (m)
        map.set(n.id, evaluateMember(m, { ...req, requestId: req.id }, data));
    }
    return map;
  }, [noms, req, data, L]);

  return (
    <Card
      title="Compare candidates"
      description={
        selectable
          ? `Select ${open} more participant${open > 1 ? "s" : ""}. Selected engineers receive an invitation to accept or decline.`
          : "Nominations from Pod Leaders for this request."
      }
      action={
        selectable && data.policies.allowDirectSelection ? (
          <Btn size="sm" onClick={() => setDirectOpen(true)}>
            <UserPlus className="size-4" /> Select someone not nominated
          </Btn>
        ) : undefined
      }
      bodyClassName=""
    >
      {noms.length === 0 ? (
        <EmptyState title="No nominations yet">
          Pod Leaders have been notified. Nominations appear here as they
          arrive.
        </EmptyState>
      ) : (
        <Table label="Nominated candidates">
          <thead className="border-eten-line border-b">
            <tr>
              {selectable && (
                <th className={th}>
                  <span className="sr-only">Select</span>
                </th>
              )}
              <th className={th}>Candidate</th>
              <th className={th}>Skills</th>
              <th className={th}>Experience</th>
              <th className={th}>Format and location</th>
              <th className={th}>Availability and conflicts</th>
              <th className={th}>Pod Leader&apos;s note</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {noms.map((n) => {
              const m = L.member(n.memberId)!;
              const ev = evals.get(n.id)!;
              const match = skillMatch(m, req);
              const can = n.status === "submitted";
              return (
                <tr
                  key={n.id}
                  className={cn(
                    "border-eten-line-soft border-b last:border-0",
                    sel.includes(m.id) && "bg-eten-accent-soft/50",
                  )}
                >
                  {selectable && (
                    <td className={td}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${m.name}`}
                        className="accent-eten-accent size-4"
                        disabled={
                          !can || (!sel.includes(m.id) && sel.length >= open)
                        }
                        checked={sel.includes(m.id)}
                        onChange={(e) =>
                          setSel((s) =>
                            e.target.checked
                              ? [...s, m.id]
                              : s.filter((x) => x !== m.id),
                          )
                        }
                      />
                    </td>
                  )}
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <Avatar name={m.name} size={30} />
                      <span>
                        <span className="block font-semibold">{m.name}</span>
                        <span className="text-eten-faint text-[12.5px]">
                          {L.pod(n.podId)?.name}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={`${td} text-[13px]`}>
                    <span
                      className={cn(
                        "font-bold",
                        match === req.skillIds.length
                          ? "text-eten-verified"
                          : "text-trk-warn",
                      )}
                    >
                      {match}/{req.skillIds.length} required
                    </span>
                    <span className="text-eten-faint block max-w-[200px]">
                      {m.skills.map((s) => L.skillName(s.skillId)).join(", ")}
                    </span>
                  </td>
                  <td className={`${td} text-[13px] whitespace-nowrap`}>
                    {SENIORITY_LABEL[m.seniority]}
                    <span className="text-eten-faint block">
                      {m.years} years
                    </span>
                  </td>
                  <td className={`${td} text-[13px]`}>
                    {m.formats.map((f) => FORMAT_LABEL[f]).join(", ")}
                    <span className="text-eten-faint block">
                      {m.cities.join(", ")}
                    </span>
                  </td>
                  <td className={td}>
                    <AvailabilityVerdict ev={ev} />
                  </td>
                  <td
                    className={`${td} text-eten-ink-muted max-w-[220px] text-[13px]`}
                  >
                    {n.justification}
                    <span className="text-eten-faint block text-[12px]">
                      {L.memberName(n.byId)} · {fmtAgo(n.at)}
                    </span>
                  </td>
                  <td className={td}>
                    <Pill tone={NOMINATION_STATUS[n.status].tone}>
                      {NOMINATION_STATUS[n.status].label}
                    </Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      {selectable && noms.length > 0 && (
        <div className="border-eten-line space-y-3 border-t px-5 py-4">
          <Field
            label="Selection rationale"
            hint="Optional. Record why you chose these engineers, especially in complex cases."
          >
            {(id) => (
              <textarea
                id={id}
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className={cn(inputClass, "h-auto py-2")}
              />
            )}
          </Field>
          {sel.some((id) =>
            noms.find(
              (n) => n.memberId === id && evals.get(n.id)!.blockers.length > 0,
            ),
          ) && (
            <Notice tone="warning">
              One or more selected candidates has a blocker. You can still
              invite them, but the meeting cannot be confirmed while a hard
              conflict remains.
            </Notice>
          )}
          <div className="flex justify-end">
            <Btn
              variant="primary"
              disabled={sel.length === 0}
              onClick={() => {
                t.selectParticipants(req.id, sel, rationale.trim());
                toast(
                  `Invited ${sel.length} engineer${sel.length > 1 ? "s" : ""}.`,
                );
                setSel([]);
              }}
            >
              <Send className="size-4" /> Select and invite {sel.length || ""}
            </Btn>
          </div>
        </div>
      )}
      {directOpen && (
        <DirectSelectDialog req={req} onClose={() => setDirectOpen(false)} />
      )}
    </Card>
  );
}

function DirectSelectDialog({
  req,
  onClose,
}: {
  req: PresalesRequest;
  onClose: () => void;
}) {
  const t = useSession();
  const { data } = t;
  const toast = useToast();
  const L = lookup(data);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Member | null>(null);
  const [reason, setReason] = useState("");
  const taken = new Set(
    data.assignments
      .filter((a) => a.requestId === req.id && a.status !== "replaced")
      .map((a) => a.memberId),
  );
  const results =
    q.trim().length < 2
      ? []
      : engineers(data)
          .filter(
            (m) =>
              !taken.has(m.id) &&
              [m.name, m.code, ...m.skills.map((s) => L.skillName(s.skillId))]
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase()),
          )
          .slice(0, 8);
  const ev = pick
    ? evaluateMember(pick, { ...req, requestId: req.id }, data)
    : null;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Select someone who was not nominated"
      description="An authorised override. It needs a written reason, is recorded in the audit log and notifies the engineer's Pod Leader."
      wide
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!pick || !reason.trim()}
            onClick={() => {
              t.selectParticipants(req.id, [pick!.id], "", reason.trim());
              toast(`Invited ${pick!.name}. The override has been recorded.`);
              onClose();
            }}
          >
            Select and invite
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Find an engineer">
          {(id) => (
            <input
              id={id}
              type="search"
              value={q}
              onChange={(e) => (setQ(e.target.value), setPick(null))}
              placeholder="Name, member ID or skill"
              className={inputClass}
            />
          )}
        </Field>
        {results.length > 0 && !pick && (
          <ul className="border-eten-line max-h-[240px] overflow-y-auto rounded-xl border">
            {results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setPick(m)}
                  className="hover:bg-eten-hover flex w-full items-center gap-2.5 px-3 py-2 text-left"
                >
                  <Avatar name={m.name} size={28} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">
                      {m.name}
                    </span>
                    <span className="text-eten-faint block truncate text-[12.5px]">
                      {L.pod(m.podId)?.name} ·{" "}
                      {m.skills.map((s) => L.skillName(s.skillId)).join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {pick && ev && (
          <div className="border-eten-line rounded-xl border p-3">
            <p className="font-semibold">{pick.name}</p>
            <AvailabilityVerdict ev={ev} />
          </div>
        )}
        <Field label="Reason for the override" required>
          {(id) => (
            <textarea
              id={id}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="For example: the client requested this engineer by name."
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ team

function Team({ req }: { req: PresalesRequest }) {
  const t = useSession();
  const { data, me } = t;
  const toast = useToast();
  const L = lookup(data);
  const [responding, setResponding] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualReason, setManualReason] = useState("");
  const owner = isSales(me) || req.ownerId === me.id;
  const all = data.assignments.filter((a) => a.requestId === req.id);
  const current = all.filter(
    (a) => !["replaced", "cancelled"].includes(a.status),
  );
  const active = current.filter((a) => a.status !== "declined");
  const accepted = active.filter((a) => a.status === "accepted");
  const evals = new Map(
    active.map((a) => [
      a.id,
      evaluateMember(
        L.member(a.memberId)!,
        { ...req, requestId: req.id },
        data,
      ),
    ]),
  );
  const blockers = accepted.some((a) => evals.get(a.id)!.state === "conflict");
  const unverified = accepted.some((a) =>
    ["unverified", "not_connected"].includes(evals.get(a.id)!.calendar),
  );
  const readyCount =
    accepted.length >= req.needed && accepted.length === active.length;
  const canConfirm =
    owner &&
    readyCount &&
    ["awaiting_acceptance", "conflict", "selection"].includes(req.status);

  return (
    <div className="space-y-6">
      <Card
        title="Participants"
        description={`${accepted.length + active.filter((a) => a.status === "confirmed").length} of ${req.needed} accepted. Meetings are confirmed only when every required participant accepts and checks pass.`}
        action={
          owner && !["completed", "cancelled", "draft"].includes(req.status) ? (
            <Btn
              size="sm"
              onClick={() => {
                t.recheck(req.id);
                toast("Availability and calendars rechecked.");
              }}
            >
              <RefreshCw className="size-4" /> Recheck availability
            </Btn>
          ) : undefined
        }
        bodyClassName=""
      >
        {all.length === 0 ? (
          <EmptyState title="Nobody selected yet">
            Selected engineers appear here with their invitation status.
          </EmptyState>
        ) : (
          <Table label="Participants">
            <thead className="border-eten-line border-b">
              <tr>
                <th className={th}>Engineer</th>
                <th className={th}>Status</th>
                <th className={th}>Availability and conflicts</th>
                <th className={th}>Calendar event</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {all.map((a) => {
                const m = L.member(a.memberId)!;
                const ev = evals.get(a.id);
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-eten-line-soft border-b last:border-0",
                      ["replaced", "cancelled"].includes(a.status) &&
                        "opacity-60",
                    )}
                  >
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar name={m.name} size={30} />
                        <span>
                          <span className="block font-semibold">
                            {m.name}
                            {a.override && (
                              <Pill tone="warning" className="ml-1.5">
                                Direct selection
                              </Pill>
                            )}
                          </span>
                          <span className="text-eten-faint text-[12.5px]">
                            {L.pod(m.podId)?.name}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      <ParticipantPill a={a} />
                      {a.status === "invitation_pending" && (
                        <span className="mt-1 block">
                          <DueBadge due={a.dueAt} />
                        </span>
                      )}
                      {a.respondedAt && (
                        <span className="text-eten-faint mt-1 block text-[12px]">
                          Responded {fmtAgo(a.respondedAt)}
                        </span>
                      )}
                      {a.declineReason && (
                        <span className="text-eten-faint mt-1 block text-[12px]">
                          {a.declineReason}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      {ev ? (
                        <AvailabilityVerdict ev={ev} />
                      ) : (
                        <span className="text-eten-faint text-[13px]">n/a</span>
                      )}
                    </td>
                    <td className={td}>
                      <Pill tone={SYNC_STATUS[a.sync].tone}>
                        {SYNC_STATUS[a.sync].label}
                      </Pill>
                      {m.calendar !== "connected" &&
                        !["replaced", "cancelled"].includes(a.status) && (
                          <span className="text-eten-faint mt-1 block text-[12px]">
                            No calendar: confirm manually
                          </span>
                        )}
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      {a.memberId === me.id &&
                        a.status === "invitation_pending" && (
                          <Btn
                            size="sm"
                            variant="primary"
                            onClick={() => setResponding(a.id)}
                          >
                            Respond
                          </Btn>
                        )}
                      {owner &&
                        ["invitation_pending", "accepted", "declined"].includes(
                          a.status,
                        ) &&
                        !["completed", "cancelled", "confirmed"].includes(
                          req.status,
                        ) && (
                          <Btn
                            size="sm"
                            variant={
                              a.status === "declined" ||
                              ev?.state === "conflict"
                                ? "danger"
                                : "ghost"
                            }
                            onClick={() => {
                              t.replaceParticipant(a.id);
                              toast(
                                `${m.name} released. Select a replacement from the nominations.`,
                              );
                            }}
                          >
                            Replace
                          </Btn>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {owner &&
        !["confirmed", "completed", "cancelled", "draft"].includes(
          req.status,
        ) && (
          <Card title="Confirmation">
            {!readyCount ? (
              <p className="text-eten-ink-muted text-[14px]">
                Waiting for {Math.max(0, req.needed - accepted.length)} more
                acceptance{req.needed - accepted.length === 1 ? "" : "s"}
                {active.some((a) => a.status === "invitation_pending")
                  ? " from invited engineers"
                  : ""}
                .
                {current.some((a) => a.status === "declined") &&
                  " A participant declined: replace them, then select someone from the nominations."}
              </p>
            ) : blockers ? (
              <Notice tone="danger" title="A hard conflict remains">
                Recheck once the participant has cleared their calendar, replace
                them, or record an authorised manual fallback.
              </Notice>
            ) : (
              <p className="text-eten-ink-muted text-[14px]">
                Everyone has accepted.{" "}
                {unverified
                  ? "Some calendars could not be verified; their events must be confirmed manually."
                  : "Calendars are free; confirming will create the calendar events."}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {canConfirm && (blockers || unverified) && (
                <Btn onClick={() => setManualOpen(true)}>
                  Confirm with manual fallback
                </Btn>
              )}
              <Btn
                variant="primary"
                disabled={!canConfirm || blockers}
                onClick={() => {
                  t.confirmMeeting(req.id);
                  toast("Meeting confirmed. Participants have been notified.");
                }}
              >
                <Check className="size-4" /> Confirm meeting
              </Btn>
            </div>
          </Card>
        )}

      <RespondDialog
        assignment={
          responding
            ? (data.assignments.find((a) => a.id === responding) ?? null)
            : null
        }
        onClose={() => setResponding(null)}
      />
      <Dialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Confirm with a manual fallback"
        description="Record how the conflict or unverified calendar was resolved. This is kept in the audit log."
        footer={
          <>
            <Btn onClick={() => setManualOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              disabled={!manualReason.trim()}
              onClick={() => {
                t.confirmMeeting(req.id, manualReason.trim());
                setManualOpen(false);
                toast("Meeting confirmed with a recorded fallback.");
              }}
            >
              Confirm meeting
            </Btn>
          </>
        }
      >
        <Field label="Fallback reason" required>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="For example: confirmed by phone that the busy slot has moved."
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------------ activity

function Activity({ req }: { req: PresalesRequest }) {
  const { data } = useSession();
  const L = lookup(data);
  const items = [...req.activity].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card
      title="Activity"
      description="Every change to this request, newest first."
      bodyClassName=""
    >
      <ol className="px-5 py-2">
        {items.map((a, i) => (
          <li
            key={i}
            className="border-eten-line-soft relative flex gap-3 border-b py-3 last:border-0"
          >
            <span
              className="bg-eten-accent mt-1.5 size-2 shrink-0 rounded-full"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[14px]">
                <span className="font-semibold">{L.memberName(a.actorId)}</span>{" "}
                · {a.text}
              </p>
              <p className="text-eten-faint text-[12.5px]">
                {fmtDateTime(a.at)} · {fmtAgo(a.at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ------------------------------------------------------------------ outcome

function Outcome({ req }: { req: PresalesRequest }) {
  const t = useSession();
  const { data, me } = t;
  const toast = useToast();
  const L = lookup(data);
  const owner = isSales(me) || req.ownerId === me.id;
  const team = data.assignments.filter(
    (a) =>
      a.requestId === req.id &&
      ["confirmed", "attended", "absent"].includes(a.status),
  );
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(team.map((a) => [a.memberId, a.status !== "absent"])),
  );
  const [summary, setSummary] = useState("");
  const [tag, setTag] = useState<OutcomeTag>("progressed");
  const [nextSteps, setNextSteps] = useState("");
  const [actions, setActions] = useState([
    { text: "", ownerName: L.memberName(req.ownerId), due: "" },
  ]);
  const started = new Date(req.startUtc).getTime() < t.now;

  if (req.outcome) {
    const o = req.outcome;
    return (
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Meeting outcome"
          action={
            <Pill tone={OUTCOME_TAG[o.tag].tone}>
              {OUTCOME_TAG[o.tag].label}
            </Pill>
          }
        >
          <p className="text-[14.5px]">{o.summary}</p>
          {o.nextSteps && (
            <p className="mt-3 text-[14px]">
              <span className="text-eten-faint">Commercial next steps: </span>
              {o.nextSteps}
            </p>
          )}
          {o.actions.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[13px] font-bold">Actions</p>
              <ul className="space-y-1 text-[14px]">
                {o.actions.map((a) => (
                  <li key={a.id}>
                    {a.text}{" "}
                    <span className="text-eten-faint">
                      · {a.ownerName}
                      {a.due && ` · due ${a.due}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-eten-faint mt-4 text-[12.5px]">
            Recorded {fmtDateTime(o.recordedAt)} by {L.memberName(o.recordedBy)}
          </p>
        </Card>
        <Card title="Attendance" bodyClassName="">
          <ul>
            {data.assignments
              .filter(
                (a) =>
                  a.requestId === req.id &&
                  ["attended", "absent"].includes(a.status),
              )
              .map((a) => (
                <li
                  key={a.id}
                  className="border-eten-line-soft flex items-center justify-between border-b px-5 py-3 last:border-0"
                >
                  <span className="font-semibold">
                    {L.memberName(a.memberId)}
                  </span>
                  <ParticipantPill a={a} />
                </li>
              ))}
          </ul>
        </Card>
      </div>
    );
  }

  if (!owner)
    return (
      <EmptyState title="No outcome recorded yet">
        The meeting owner records attendance and outcomes after the meeting.
      </EmptyState>
    );
  if (!started) {
    return (
      <EmptyState title="This meeting has not happened yet">
        Outcomes can be recorded once the meeting starts (
        {fmtRange(req.startUtc, req.endUtc, req.timezone)}).
      </EmptyState>
    );
  }

  return (
    <Card
      title="Record the outcome"
      description="Attendance, notes, action owners, due dates and commercial next steps (PRD FR-026)."
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          t.recordOutcome(req.id, attendance, {
            summary: summary.trim(),
            tag,
            nextSteps: nextSteps.trim(),
            actions: actions
              .filter((a) => a.text.trim())
              .map((a, i) => ({ ...a, id: `act-${Date.now()}-${i}` })),
          });
          toast("Outcome recorded.");
        }}
      >
        <div>
          <p className="mb-2 text-[13px] font-semibold">Attendance</p>
          <div className="space-y-2">
            {team.map((a) => (
              <Toggle
                key={a.id}
                checked={attendance[a.memberId] !== false}
                onChange={(v) =>
                  setAttendance((x) => ({ ...x, [a.memberId]: v }))
                }
              >
                {L.memberName(a.memberId)} attended
              </Toggle>
            ))}
          </div>
        </div>
        <Field label="Summary" required>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome">
            {(id) => (
              <select
                id={id}
                value={tag}
                onChange={(e) => setTag(e.target.value as OutcomeTag)}
                className={inputClass}
              >
                {(Object.keys(OUTCOME_TAG) as OutcomeTag[]).map((k) => (
                  <option key={k} value={k}>
                    {OUTCOME_TAG[k].label[0].toUpperCase() +
                      OUTCOME_TAG[k].label.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Commercial next steps">
            {(id) => (
              <input
                id={id}
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                className={inputClass}
              />
            )}
          </Field>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold">Actions</p>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_160px]">
                <input
                  aria-label="Action"
                  value={a.text}
                  placeholder="Action"
                  onChange={(e) =>
                    setActions((x) =>
                      x.map((y, j) =>
                        j === i ? { ...y, text: e.target.value } : y,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <input
                  aria-label="Owner"
                  value={a.ownerName}
                  placeholder="Owner"
                  onChange={(e) =>
                    setActions((x) =>
                      x.map((y, j) =>
                        j === i ? { ...y, ownerName: e.target.value } : y,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <input
                  aria-label="Due date"
                  type="date"
                  value={a.due}
                  onChange={(e) =>
                    setActions((x) =>
                      x.map((y, j) =>
                        j === i ? { ...y, due: e.target.value } : y,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <Btn
            size="sm"
            variant="subtle"
            className="mt-2"
            onClick={() =>
              setActions((x) => [...x, { text: "", ownerName: "", due: "" }])
            }
          >
            Add action
          </Btn>
        </div>
        <div className="flex justify-end">
          <Btn type="submit" variant="primary" disabled={!summary.trim()}>
            Save outcome
          </Btn>
        </div>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------------ dialogs

function CancelDialog({
  req,
  onClose,
}: {
  req: PresalesRequest;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const router = useRouter();
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Cancel ${req.ref}?`}
      description="Invited and confirmed participants are notified and their calendar events are cancelled."
      footer={
        <>
          <Btn onClick={onClose}>Keep request</Btn>
          <Btn
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => {
              t.cancelRequest(req.id, reason.trim());
              toast("Request cancelled.");
              onClose();
              router.refresh();
            }}
          >
            Cancel request
          </Btn>
        </>
      }
    >
      <Field label="Reason" required>
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
    </Dialog>
  );
}

function RescheduleDialog({
  req,
  onClose,
}: {
  req: PresalesRequest;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [date, setDate] = useState(zonedDate(req.startUtc, req.timezone));
  const [start, setStart] = useState(zonedTime(req.startUtc, req.timezone));
  const [end, setEnd] = useState(zonedTime(req.endUtc, req.timezone));
  const bad = !date || toMinutes(end) <= toMinutes(start);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Reschedule the meeting"
      description="Participants who accepted are asked to confirm the new time, and availability is rechecked."
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={bad}
            onClick={() => {
              t.reschedule(
                req.id,
                zonedToUtc(date, start, req.timezone).toISOString(),
                zonedToUtc(date, end, req.timezone).toISOString(),
              );
              toast("Rescheduled. Participants have been asked to confirm.");
              onClose();
            }}
          >
            Reschedule
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Date">
          {(id) => (
            <input
              id={id}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Start">
          {(id) => (
            <input
              id={id}
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          label="End"
          error={bad ? "Meeting end must be after the start." : undefined}
        >
          {(id) => (
            <input
              id={id}
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <p className="text-eten-faint mt-2 text-[12.5px]">
        Times are in {req.timezone}.
      </p>
    </Dialog>
  );
}
