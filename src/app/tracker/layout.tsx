import type { Metadata } from "next";
import { TrackerProvider } from "@/lib/tracker/store";
import { ToastProvider } from "@/components/tracker/ui";

/**
 * ETEN Availability & Presales Coordination Tracker (Phase 1: frontend demo).
 * Everything under /tracker runs on fictional demo data held in the visitor's
 * browser, so the pages are kept out of search results.
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
      <TrackerProvider>
        <ToastProvider>{children}</ToastProvider>
      </TrackerProvider>
    </div>
  );
}
