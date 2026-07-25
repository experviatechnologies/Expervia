import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  // The proxy sends unauthenticated visitors to /admin/login; authenticated
  // ones land on the applications dashboard.
  redirect("/admin/applications");
}
