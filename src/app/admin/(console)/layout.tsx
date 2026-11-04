import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations, mfaPath } from "@/lib/auth";
import { AdminShell } from "./admin-shell";

/**
 * Shared shell for every authenticated admin page. The proxy (src/proxy.ts)
 * already gates /admin to signed-in operations members and bounces everyone
 * else to /admin/login; this re-checks as defence in depth and hands the
 * manager's identity to the shell. Admin access needs two-step sign-in
 * (isOperations() checks the session reached aal2). /admin/login and the /admin index redirect
 * live OUTSIDE this route group, so they render without the console chrome.
 */
export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) {
    // Operations, but no authenticator code yet this session.
    const member = await getCurrentMember();
    redirect(
      member?.role === "operations" ? mfaPath("/admin/overview") : "/dashboard",
    );
  }

  return <AdminShell managerEmail={manager.email ?? ""}>{children}</AdminShell>;
}
