import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "ETEN Mentorship",
    template: "%s · ETEN Mentorship",
  },
  description:
    "Grow real capability with a verified mentor. Join an ETEN Mentorship Circle, set a goal, and build evidence that moves you up the readiness ladder.",
};

/**
 * Shell for the standalone ETEN Mentorship product (served at
 * mentorship.expervia.com, and reachable at /mentorship until the subdomain is
 * wired). It owns its own dark ground and lighter-purple brand theme (mnt-*
 * tokens) and deliberately carries NO marketing navbar or member-app chrome —
 * site-chrome.tsx excludes /mentorship, and each area brings its own nav.
 */
export default function MentorshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-mnt-bg text-mnt-ink min-h-screen font-sans">
      {children}
    </div>
  );
}
