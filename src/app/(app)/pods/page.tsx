import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { SectionStub } from "../section-stub";

export const metadata: Metadata = {
  title: "Explore Pods",
  robots: { index: false, follow: false },
};

export default function PodsPage() {
  return (
    <SectionStub
      eyebrow="ETEN"
      title="Explore Pods"
      description="Browse the six specialist pods, see their leadership and member counts, and join the communities where you do your best work."
      milestone="M2"
      Icon={LayoutGrid}
    />
  );
}
