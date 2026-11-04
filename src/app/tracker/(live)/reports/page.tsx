import type { Metadata } from "next";
import { ReportsView } from "@/app/tracker/demo/(app)/reports/view";

export const metadata: Metadata = { title: "Reports" };

// Same screen as the demo; on live the KPIs are calculated from the data the
// server sent for this (Sales, Management or admin) viewer.
export default function Page() {
  return <ReportsView />;
}
