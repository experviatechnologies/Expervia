import type { Metadata } from "next";
import { DirectoryView } from "@/app/tracker/demo/(app)/directory/view";

export const metadata: Metadata = { title: "ETEN Directory" };

// Same screen as the demo, fed with live data (trimmed per viewer on the
// server) by LiveTrackerProvider.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pod?: string; record?: string }>;
}) {
  const sp = await searchParams;
  return (
    <DirectoryView
      initialQuery={sp.q ?? ""}
      initialPod={sp.pod ?? ""}
      initialRecord={sp.record ?? ""}
    />
  );
}
