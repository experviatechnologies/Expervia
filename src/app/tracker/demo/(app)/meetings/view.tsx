"use client";

/**
 * Meetings. Engineers see their invitations (accept / decline), upcoming and
 * past meetings. Sales Managers also see every confirmed and completed
 * presales meeting, with outcomes to record after each one.
 */
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/tracker/store";
import { isSales, lookup } from "@/lib/tracker/selectors";
import { OUTCOME_TAG } from "@/lib/tracker/labels";
import type { Assignment, PresalesRequest } from "@/lib/tracker/types";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  Tabs,
} from "@/components/tracker/ui";
import {
  DueBadge,
  FormatPills,
  MeetingMeta,
  ParticipantPill,
  RefLink,
  RespondDialog,
  requestHref,
} from "@/components/tracker/bits";

type Tab = "invitations" | "upcoming" | "past";

export function MeetingsView() {
  const { data, me, now } = useSession();
  const L = lookup(data);
  const sales = isSales(me);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t === "upcoming" || t === "past") return t;
    }
    return "invitations";
  });
  const [responding, setResponding] = useState<Assignment | null>(null);
  const reqOf = (id: string) => data.requests.find((r) => r.id === id)!;

  const invitations = data.assignments.filter(
    (a) =>
      a.memberId === me.id &&
      a.status === "invitation_pending" &&
      !["cancelled", "completed"].includes(reqOf(a.requestId).status),
  );

  // Sales see every confirmed meeting; engineers see the ones they are on.
  const meetingReqs: PresalesRequest[] = sales
    ? data.requests.filter((r) => ["confirmed", "completed"].includes(r.status))
    : data.assignments
        .filter(
          (a) =>
            a.memberId === me.id &&
            ["accepted", "confirmed", "attended", "absent"].includes(a.status),
        )
        .map((a) => reqOf(a.requestId))
        .filter((r) => r.status !== "cancelled");
  const upcoming = meetingReqs
    .filter((r) => new Date(r.endUtc).getTime() >= now)
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  const past = meetingReqs
    .filter((r) => new Date(r.endUtc).getTime() < now)
    .sort((a, b) => b.startUtc.localeCompare(a.startUtc));

  const team = (r: PresalesRequest) =>
    data.assignments.filter(
      (a) =>
        a.requestId === r.id &&
        ["accepted", "confirmed", "attended", "absent"].includes(a.status),
    );

  return (
    <>
      <PageHeader
        title="Meetings"
        description={
          sales
            ? "Confirmed and completed presales meetings. Record attendance and outcomes after each meeting."
            : "Your invitations and the client meetings you are confirmed for."
        }
      />
      <Tabs<Tab>
        label="Meetings"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "invitations",
            label: "Invitations",
            count: invitations.length,
          },
          { id: "upcoming", label: "Upcoming", count: upcoming.length },
          { id: "past", label: "Past", count: past.length },
        ]}
      />

      {tab === "invitations" && (
        <Card bodyClassName="">
          {invitations.length === 0 ? (
            <EmptyState title="No invitations">
              When the Sales Manager selects you for a meeting, the invitation
              appears here.
            </EmptyState>
          ) : (
            <ul>
              {invitations.map((a) => {
                const r = reqOf(a.requestId);
                return (
                  <li
                    key={a.id}
                    className="border-eten-line-soft flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RefLink req={r} />
                        <ParticipantPill a={a} />
                        <FormatPills req={r} />
                      </div>
                      <Link
                        href={requestHref(r.id)}
                        className="hover:text-eten-accent mt-1 block font-bold"
                      >
                        {r.title}
                      </Link>
                      <MeetingMeta req={r} />
                    </div>
                    <DueBadge due={a.dueAt} />
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick={() => setResponding(a)}
                    >
                      Respond
                    </Btn>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab !== "invitations" && (
        <Card bodyClassName="">
          {(tab === "upcoming" ? upcoming : past).length === 0 ? (
            <EmptyState
              title={
                tab === "upcoming" ? "No upcoming meetings" : "No past meetings"
              }
            />
          ) : (
            <ul>
              {(tab === "upcoming" ? upcoming : past).map((r) => {
                const mine = data.assignments.find(
                  (a) => a.requestId === r.id && a.memberId === me.id,
                );
                const needsOutcome =
                  sales &&
                  r.status === "confirmed" &&
                  new Date(r.endUtc).getTime() < now;
                return (
                  <li
                    key={r.id}
                    className="border-eten-line-soft flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RefLink req={r} />
                        {r.status === "confirmed" ? (
                          <Pill tone="success">Confirmed</Pill>
                        ) : (
                          <Pill>Completed</Pill>
                        )}
                        {!sales && mine && mine.status === "accepted" && (
                          <Pill tone="warning">Awaiting confirmation</Pill>
                        )}
                        <FormatPills req={r} />
                        {r.outcome && (
                          <Pill tone={OUTCOME_TAG[r.outcome.tag].tone}>
                            {OUTCOME_TAG[r.outcome.tag].label}
                          </Pill>
                        )}
                      </div>
                      <Link
                        href={requestHref(r.id)}
                        className="hover:text-eten-accent mt-1 block font-bold"
                      >
                        {r.title}
                      </Link>
                      <MeetingMeta req={r} />
                      <p className="text-eten-faint mt-0.5 text-[12.5px]">
                        {team(r)
                          .map((a) => L.memberName(a.memberId))
                          .join(", ")}
                      </p>
                    </div>
                    {needsOutcome && (
                      <>
                        <Pill tone="warning">Outcome needed</Pill>
                        <Btn
                          size="sm"
                          variant="primary"
                          href={requestHref(r.id, "outcome")}
                        >
                          Record outcome
                        </Btn>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
      <RespondDialog
        assignment={responding}
        onClose={() => setResponding(null)}
      />
    </>
  );
}
