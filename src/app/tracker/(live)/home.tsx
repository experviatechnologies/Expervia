"use client";

/**
 * Live tracker home while the member pages switch on phase by phase: the
 * signed-in member's roles, live counts and what is available so far.
 */
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { useSession } from "@/lib/tracker/store";
import { hasDeclared } from "@/lib/tracker/availability";
import { ROLE_LABEL } from "@/lib/tracker/labels";
import { engineers } from "@/lib/tracker/selectors";
import {
  Btn,
  Card,
  PageHeader,
  Pill,
  SectionLabel,
  Stat,
} from "@/components/tracker/ui";

export function LiveHome() {
  const { me, data, ledPods } = useSession();
  const first = me.name.split(" ")[0];
  const eng = engineers(data);
  const isEngineer = me.roles.includes("member");

  return (
    <>
      <PageHeader
        title={`Welcome, ${first}`}
        description="The ETEN Availability & Presales Tracker is going live step by step. Here is where things stand."
        actions={
          isEngineer && (
            <Btn href="/tracker/availability" variant="primary">
              Set my availability <ArrowRight className="size-4" />
            </Btn>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Your tracker access">
          {me.roles.length === 0 ? (
            <p className="text-eten-ink-muted text-[14px]">
              You do not have a tracker role yet. Engineers get access by
              joining a specialist pod; Sales and Management roles are granted
              by an administrator.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {me.roles.map((r) => (
                <Pill key={r} tone="brand">
                  {ROLE_LABEL[r]}
                </Pill>
              ))}
            </div>
          )}
          {ledPods.length > 0 && (
            <p className="text-eten-ink-muted mt-3 text-[13.5px]">
              You lead: {ledPods.map((p) => p.name).join(", ")}
            </p>
          )}
        </Card>

        <Card title="What is live">
          <ul className="space-y-2 text-[14px]">
            {(
              [
                [true, "Sign-in, roles and access rules"],
                [
                  true,
                  "My availability: weekly hours, date exceptions and meeting preferences",
                ],
                [false, "Settings and dashboards (Phase 4)"],
                [
                  false,
                  "Requests, nominations, selection and invitations (Phase 5)",
                ],
                [false, "Meetings, outcomes, dashboards and reports (Phase 6)"],
              ] as const
            ).map(([done, text]) => (
              <li key={text} className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2
                    className="text-eten-verified size-4"
                    aria-hidden
                  />
                ) : (
                  <Clock3 className="text-eten-faint size-4" aria-hidden />
                )}
                <span className={done ? "" : "text-eten-ink-muted"}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/tracker/demo/login"
            className="text-eten-accent mt-4 inline-flex items-center gap-1 text-[14px] font-semibold"
          >
            Explore the full workflow in the demo{" "}
            <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="mt-8">
        <SectionLabel>Live data</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Pods" value={data.pods.length} />
          <Stat label="Skills" value={data.skills.length} />
          <Stat label="Active engineers" value={eng.length} />
          <Stat
            label="Declared presales availability"
            value={eng.filter(hasDeclared).length}
          />
          <Stat label="Requests you can see" value={data.requests.length} />
          <Stat label="Meeting types" value={data.meetingTypes.length} />
        </div>
      </div>
    </>
  );
}
