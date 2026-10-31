import type { Metadata } from "next";
import { AvailabilityView } from "./view";

export const metadata: Metadata = { title: "My availability" };

export default function Page() {
  return <AvailabilityView />;
}
