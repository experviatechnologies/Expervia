import { TrackerProvider } from "@/lib/tracker/store";
import { ToastProvider } from "@/components/tracker/ui";

/**
 * Stakeholder demo (Phase 1 frontend): every person, client and figure is
 * fictional and lives only in the visitor's browser (src/lib/tracker/store).
 */
export default function TrackerDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrackerProvider>
      <ToastProvider>{children}</ToastProvider>
    </TrackerProvider>
  );
}
