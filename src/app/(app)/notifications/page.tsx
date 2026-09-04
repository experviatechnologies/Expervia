import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { SectionStub } from "../section-stub";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <SectionStub
      eyebrow="ETEN"
      title="Notifications"
      description="Your notification center for mentions, comments, reactions, messages and pod activity — with per-category preferences and email delivery."
      milestone="M3"
      Icon={Bell}
    />
  );
}
