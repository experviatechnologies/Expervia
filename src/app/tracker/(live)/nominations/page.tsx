import type { Metadata } from "next";
import { NominationsView } from "@/app/tracker/demo/(app)/nominations/view";

export const metadata: Metadata = { title: "Nominations" };

export default function Page() {
  return <NominationsView />;
}
