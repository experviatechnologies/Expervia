import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AppNav, type NavPod } from "./app-nav";

/**
 * Shell for the ETEN member app: persistent navigation (Feed · Explore Pods ·
 * Messages · Notifications · My Profile) around every signed-in page.
 *
 * Gates the whole app in one place (defence-in-depth — each page still verifies
 * itself):
 *   - no session          → /signin
 *   - confirmed, non-ops, no primary pod → /onboarding (first-run setup)
 * Operations skip onboarding; unconfirmed members pass through so /dashboard can
 * show them the "confirm your email" notice.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  // Suspended / deactivated members can't use the app — they see the notice.
  if (member.status !== "active") redirect("/suspended");

  const supabase = await createSupabaseServerClient();

  if (member.role !== "operations" && member.emailConfirmed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_specialization_pod_id")
      .eq("member_id", member.id)
      .maybeSingle();
    if (!profile?.primary_specialization_pod_id) redirect("/onboarding");
  }

  // Unread badges for the nav.
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", member.id)
    .eq("is_read", false);

  const badges: Record<string, number> = {};
  if (unreadNotifications && unreadNotifications > 0) {
    badges["/notifications"] = unreadNotifications;
  }

  // The member's pods, shown as channels in the rail.
  const { data: podRows } = await supabase
    .from("pod_memberships")
    .select("role_in_pod, pods(name, slug, is_main)")
    .eq("member_id", member.id);

  const pods: NavPod[] = (podRows ?? [])
    .map((row) => {
      const r = row as unknown as {
        role_in_pod: NavPod["role"];
        pods: { name: string; slug: string; is_main: boolean } | null;
      };
      return r.pods && !r.pods.is_main
        ? { name: r.pods.name, slug: r.pods.slug, role: r.role_in_pod }
        : null;
    })
    .filter((p): p is NavPod => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen">
      <AppNav
        memberName={member.fullName}
        email={member.email}
        isOps={member.role === "operations"}
        badges={badges}
        pods={pods}
      />
      <div className="md:pl-64">
        <main className="bg-eten-canvas min-h-screen pb-24 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
