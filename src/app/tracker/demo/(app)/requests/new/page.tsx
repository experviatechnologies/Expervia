import type { Metadata } from "next";
import { RequestForm } from "./form";

export const metadata: Metadata = { title: "New presales request" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  return <RequestForm editId={sp.edit} />;
}
