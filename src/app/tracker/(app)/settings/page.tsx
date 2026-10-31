import type { Metadata } from "next";
import { SettingsView } from "./view";

export const metadata: Metadata = { title: "Settings" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  return <SettingsView initialTab={sp.tab ?? "profile"} />;
}
