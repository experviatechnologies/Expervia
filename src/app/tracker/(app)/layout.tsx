import { TrackerShell } from "@/components/tracker/shell";

export default function TrackerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrackerShell>{children}</TrackerShell>;
}
