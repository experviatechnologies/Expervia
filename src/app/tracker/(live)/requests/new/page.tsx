import type { Metadata } from "next";
import { RequestForm } from "@/app/tracker/demo/(app)/requests/new/form";

export const metadata: Metadata = { title: "New presales request" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  return <RequestForm editId={sp.edit} />;
}
