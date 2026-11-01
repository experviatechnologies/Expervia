import type { Metadata } from "next";
import { AvailabilityView } from "@/app/tracker/demo/(app)/availability/view";

export const metadata: Metadata = { title: "My availability" };

// Same screen as the demo, fed with live data by LiveTrackerProvider.
export default function Page() {
  return <AvailabilityView />;
}
