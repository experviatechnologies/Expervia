import { Database } from "lucide-react";
import { requireTrackerSession } from "@/lib/tracker/server/session";
import { loadTrackerDataForViewer } from "@/lib/tracker/server/data";
import { LiveTrackerProvider } from "@/components/tracker/live-provider";
import { TrackerShell } from "@/components/tracker/shell";
import { ToastProvider } from "@/components/tracker/ui";

/**
 * Pages switched on in the live tracker. Each Phase 4 to 6 step adds to this
 * list; the shell's navigation and access checks only offer these.
 */
const LIVE_PAGES = [
  "dashboard",
  "availability",
  "directory",
  "requests",
  "settings",
];

/**
 * The real tracker (behind the ETEN sign-in). Loads the signed-in member's
 * view of the data on the server, trimmed to what they may see, and renders
 * the same screens as the demo through LiveTrackerProvider.
 */
export default async function LiveTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTrackerSession("/tracker");

  let problem: string | null = session.schemaReady
    ? null
    : "Migrations 46 and 47 have not been run.";
  let data = null;
  if (!problem) {
    try {
      data = await loadTrackerDataForViewer(session);
    } catch (e) {
      problem = e instanceof Error ? e.message : "Unknown error";
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <div className="border-trk-warn/30 bg-trk-warn-soft flex gap-3 rounded-2xl border p-5 text-[14px]">
          <Database
            className="text-trk-warn mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <p className="font-bold">The tracker couldn&apos;t load its data</p>
            <p className="text-eten-faint mt-1 text-[12.5px]">{problem}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <LiveTrackerProvider
        data={data}
        meId={session.member.id}
        enabledPages={LIVE_PAGES}
      >
        <TrackerShell>{children}</TrackerShell>
      </LiveTrackerProvider>
    </ToastProvider>
  );
}
