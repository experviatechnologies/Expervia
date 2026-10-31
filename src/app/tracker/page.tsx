import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Database } from "lucide-react";
import { requireTrackerSession } from "@/lib/tracker/server/session";
import { loadTrackerData } from "@/lib/tracker/server/data";
import { hasDeclared } from "@/lib/tracker/availability";
import { ROLE_LABEL } from "@/lib/tracker/labels";
import type { TrackerData } from "@/lib/tracker/types";

export const metadata: Metadata = { title: "Tracker" };

/**
 * Real tracker entry point (Phase 2, step 2.4). Behind the ETEN sign-in; shows
 * the roles the server resolved for this person and live counts read through
 * the server data layer, so the wiring can be verified before the full pages
 * switch from the demo store to live data (Phases 4 to 6).
 */
export default async function TrackerHome() {
  const session = await requireTrackerSession("/tracker");
  const first = session.member.fullName?.split(" ")[0] ?? "there";

  let data: TrackerData | null = null;
  let loadError: string | null = null;
  if (session.schemaReady) {
    try {
      data = await loadTrackerData(session);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Unknown error";
    }
  }

  const engineers =
    data?.members.filter(
      (m) => m.roles.includes("member") && m.status === "active",
    ) ?? [];
  const stats = data
    ? [
        { label: "Pods", value: data.pods.length },
        { label: "Skills in the taxonomy", value: data.skills.length },
        { label: "Active engineers", value: engineers.length },
        {
          label: "Engineers with presales availability",
          value: engineers.filter(hasDeclared).length,
        },
        { label: "Presales requests you can see", value: data.requests.length },
        { label: "Meeting types", value: data.meetingTypes.length },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      <span className="inline-flex rounded-xl bg-white px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/expervia-logo.png"
          alt="Expervia Technologies"
          className="h-auto w-[132px]"
        />
      </span>
      <h1 className="mt-6 text-[28px] font-extrabold tracking-[-0.02em]">
        Welcome, {first}
      </h1>
      <p className="text-eten-ink-muted mt-1.5 text-[15px]">
        The ETEN Availability &amp; Presales Tracker is being connected to live
        data. Here is what the system knows about you so far.
      </p>

      <section className="border-eten-line bg-eten-panel mt-6 rounded-2xl border p-5">
        <h2 className="text-[15.5px] font-bold">Your tracker access</h2>
        {session.roles.length === 0 ? (
          <p className="text-eten-ink-muted mt-2 text-[14px]">
            You do not have a tracker role yet. Engineers get access by joining
            a specialist pod; Sales and Management roles are granted by an
            administrator.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {session.roles.map((r) => (
              <li
                key={r}
                className="bg-eten-accent-soft text-eten-accent rounded-lg px-2.5 py-1 text-[13px] font-semibold"
              >
                {ROLE_LABEL[r]}
              </li>
            ))}
          </ul>
        )}
        {session.roles.includes("admin") && (
          <p className="text-eten-ink-muted mt-3 text-[13.5px]">
            To give someone the Sales Manager or Management role, open their
            profile in{" "}
            <Link
              href="/admin/members"
              className="text-eten-accent font-semibold underline"
            >
              Admin &gt; Members
            </Link>{" "}
            and use Presales tracker roles.
          </p>
        )}
        {session.ledPodIds.length > 0 && data && (
          <p className="text-eten-ink-muted mt-3 text-[13.5px]">
            You lead:{" "}
            {session.ledPodIds
              .map((id) => data!.pods.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </section>

      {!session.schemaReady || loadError ? (
        <section className="border-trk-warn/30 bg-trk-warn-soft mt-6 flex gap-3 rounded-2xl border p-5 text-[14px]">
          <Database
            className="text-trk-warn mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <p className="font-bold">The tracker database is not set up yet</p>
            <p className="mt-1">
              Run migrations <code>46_presales_roles_profiles.sql</code> and{" "}
              <code>47_presales_workflow.sql</code> in Supabase, then reload
              this page.
            </p>
            {loadError && (
              <p className="text-eten-faint mt-1 text-[12.5px]">
                Details: {loadError}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-6">
          <h2 className="text-eten-faint mb-3 text-[12px] font-bold tracking-[0.12em] uppercase">
            Live data check
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="border-eten-line bg-eten-panel rounded-2xl border p-4"
              >
                <p className="text-eten-ink-muted text-[13px]">{s.label}</p>
                <p className="mt-1.5 text-[26px] font-extrabold">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border-eten-line bg-eten-panel mt-6 rounded-2xl border p-5">
        <h2 className="text-[15.5px] font-bold">What is live</h2>
        <ul className="mt-3 space-y-2 text-[14px]">
          {[
            [true, "Sign-in, roles and access rules"],
            [false, "Your availability and the ETEN directory (Phase 4)"],
            [
              false,
              "Requests, nominations, selection and invitations (Phase 5)",
            ],
            [false, "Meetings, outcomes, dashboards and reports (Phase 6)"],
          ].map(([done, text]) => (
            <li key={text as string} className="flex items-center gap-2">
              {done ? (
                <CheckCircle2
                  className="text-eten-verified size-4"
                  aria-hidden
                />
              ) : (
                <Clock3 className="text-eten-faint size-4" aria-hidden />
              )}
              <span className={done ? "" : "text-eten-ink-muted"}>{text}</span>
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
      </section>
    </div>
  );
}
