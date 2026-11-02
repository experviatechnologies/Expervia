import type { Metadata } from "next";
import { RequestDetail } from "@/app/tracker/demo/(app)/requests/[id]/view";

export const metadata: Metadata = { title: "Presales request" };

// Access is checked twice: the server only sends requests this person may
// see (src/lib/tracker/server/data.ts), and the screen checks again.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return <RequestDetail id={id} initialTab={sp.tab ?? "overview"} />;
}
