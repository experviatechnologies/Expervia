import type { Metadata } from "next";
import { RequestDetail } from "./view";

export const metadata: Metadata = { title: "Presales request" };

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
