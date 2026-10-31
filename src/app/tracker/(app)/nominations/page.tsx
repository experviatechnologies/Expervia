import type { Metadata } from "next";
import { NominationsView } from "./view";

export const metadata: Metadata = { title: "Nominations" };

export default function Page() {
  return <NominationsView />;
}
