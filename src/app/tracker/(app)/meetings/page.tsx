import type { Metadata } from "next";
import { MeetingsView } from "./view";

export const metadata: Metadata = { title: "Meetings" };

export default function Page() {
  return <MeetingsView />;
}
