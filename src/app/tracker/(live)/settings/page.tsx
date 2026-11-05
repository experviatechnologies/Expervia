import type { Metadata } from "next";
import { SettingsView } from "@/app/tracker/demo/(app)/settings/view";

export const metadata: Metadata = { title: "Settings" };

// Same screen as the demo; on live it shows the profile and calendar tabs
// (administration stays in the admin console).
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; calendar?: string }>;
}) {
  const sp = await searchParams;
  return (
    <SettingsView
      initialTab={sp.tab ?? "profile"}
      calendarResult={sp.calendar}
    />
  );
}
