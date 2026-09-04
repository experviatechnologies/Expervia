import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { SectionStub } from "../section-stub";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return (
    <SectionStub
      eyebrow="ETEN"
      title="Messages"
      description="Purposeful direct messaging with other members over real-time chat — with file sharing, blocking and reporting. Built to be an inbox, not another group chat."
      milestone="M3"
      Icon={MessageSquare}
    />
  );
}
