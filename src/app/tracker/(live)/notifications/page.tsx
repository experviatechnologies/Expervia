import type { Metadata } from "next";
import { NotificationsView } from "@/app/tracker/demo/(app)/notifications/view";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsView />;
}
