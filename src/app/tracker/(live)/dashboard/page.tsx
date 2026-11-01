import type { Metadata } from "next";
import { DashboardView } from "@/app/tracker/demo/(app)/dashboard/view";
import { LiveRollout } from "../home";

export const metadata: Metadata = { title: "Dashboard" };

// Same role-based dashboard as the demo, on live data. Request and meeting
// sections fill in once the workflow goes live (Phase 5).
export default function Page() {
  return (
    <>
      <DashboardView />
      <LiveRollout />
    </>
  );
}
