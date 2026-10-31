import type { Metadata } from "next";

/**
 * ETEN Availability & Presales Coordination Tracker.
 *
 * /tracker       the real tracker, behind the ETEN sign-in (gated in proxy.ts
 *                and again per page via getTrackerSession()).
 * /tracker/demo  the stakeholder demo on fictional, in-browser data.
 * Neither is meant for search engines.
 */
export const metadata: Metadata = {
  title: {
    default: "ETEN Availability Tracker | Expervia Technologies",
    template: "%s | ETEN Availability Tracker",
  },
  description:
    "Engineer availability, Pod Leader nominations, Sales Manager selection and presales meeting coordination for the Expervia Technology Experts Network.",
  robots: { index: false, follow: false },
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-app-surface className="bg-eten-canvas text-eten-ink min-h-screen">
      {children}
    </div>
  );
}
