import type { Metadata } from "next";
import { LiveHome } from "./home";

export const metadata: Metadata = { title: "Tracker" };

export default function TrackerHome() {
  return <LiveHome />;
}
