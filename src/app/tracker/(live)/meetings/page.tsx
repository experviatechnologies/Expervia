import type { Metadata } from "next";
import { MeetingsView } from "@/app/tracker/demo/(app)/meetings/view";

export const metadata: Metadata = { title: "Meetings" };

export default function Page() {
  return <MeetingsView />;
}
