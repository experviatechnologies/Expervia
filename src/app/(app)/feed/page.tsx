import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { SectionStub } from "../section-stub";

export const metadata: Metadata = {
  title: "Feed",
  robots: { index: false, follow: false },
};

export default function FeedPage() {
  return (
    <SectionStub
      eyebrow="ETEN"
      title="Community Feed"
      description="The reverse-chronological feed from the Main Community and the pods you join — posts, attachments, comments, reactions and mentions."
      milestone="M2"
      Icon={Newspaper}
    />
  );
}
