import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AppNav } from "./app-nav";

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

  if (member.role !== "operations" && member.emailConfirmed) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_specialization_pod_id")
      .eq("member_id", member.id)
      .maybeSingle();
    if (!profile?.primary_specialization_pod_id) redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <AppNav
        memberName={member.fullName}
        email={member.email}
        isOps={member.role === "operations"}
      />
      <div className="md:pl-60">
        <div className="pb-24 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
