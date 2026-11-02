"use client";

/**
 * "What's live so far" card shown under the live dashboard while the tracker
 * switches on phase by phase.
 */
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { Card } from "@/components/tracker/ui";

const ROLLOUT: [boolean, string][] = [
  [true, "Sign-in, roles and access rules"],
  [
    true,
    "My availability: weekly hours, date exceptions and meeting preferences",
  ],
  [
    true,
    "ETEN Directory, with the who-is-free check for Sales and Pod Leaders",
  ],
  [true, "Settings: expertise profile, skill levels and presales opt-out"],
  [true, "Your dashboard"],
  [true, "Presales requests: create, route to pods, edit, reschedule, cancel"],
  [false, "Nominations, selection and invitations (Phase 5)"],
  [false, "Meetings, outcomes, notifications and reports (Phase 6)"],
];

export function LiveRollout() {
  return (
    <Card
      title="The tracker is going live in stages"
      description="Parts not switched on yet show as empty. Explore the full workflow in the demo."
      className="mt-8"
    >
      <ul className="grid gap-2 text-[14px] sm:grid-cols-2">
        {ROLLOUT.map(([done, text]) => (
          <li key={text} className="flex items-start gap-2">
            {done ? (
              <CheckCircle2
                className="text-eten-verified mt-0.5 size-4 shrink-0"
                aria-hidden
              />
            ) : (
              <Clock3
                className="text-eten-faint mt-0.5 size-4 shrink-0"
                aria-hidden
              />
            )}
            <span className={done ? "" : "text-eten-ink-muted"}>{text}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/tracker/demo/login"
        className="text-eten-accent mt-4 inline-flex items-center gap-1 text-[14px] font-semibold"
      >
        Open the demo <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}
