import type { Metadata } from "next";
import { DirectoryView } from "./view";

export const metadata: Metadata = { title: "ETEN Directory" };

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
