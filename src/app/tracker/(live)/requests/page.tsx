import type { Metadata } from "next";
import { RequestsView } from "@/app/tracker/demo/(app)/requests/view";

export const metadata: Metadata = { title: "Presales requests" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  return <RequestsView initialStage={sp.stage ?? ""} />;
}
