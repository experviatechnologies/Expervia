import type { Metadata } from "next";
import { RequestsView } from "./view";

export const metadata: Metadata = { title: "Presales requests" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  return <RequestsView initialStage={sp.stage ?? ""} />;
}
