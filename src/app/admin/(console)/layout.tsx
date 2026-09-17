import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { AdminShell } from "./admin-shell";

/**
 * Shared shell for every authenticated admin page. The proxy (src/proxy.ts)
 * already gates /admin to signed-in operations members and bounces everyone
 * else to /admin/login; this re-checks as defence in depth and hands the
 * manager's identity to the shell. /admin/login and the /admin index redirect
 * live OUTSIDE this route group, so they render without the console chrome.
 */
export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  return <AdminShell managerEmail={manager.email ?? ""}>{children}</AdminShell>;
}
