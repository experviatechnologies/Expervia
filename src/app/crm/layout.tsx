import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { CRM_ROLE_LABEL, getCrmSession } from "@/lib/crm/session";
import { reviewCount } from "@/lib/crm/review";
import { myDueCount } from "@/lib/crm/tasks";
import { CrmShell } from "@/components/crm/shell";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · Expervia CRM" },
  robots: { index: false, follow: false },
};

/**
 * Every CRM screen is staff only (operations, Sales Manager, Management). The
 * proxy sends signed-out visitors to sign in; this re-checks the role on the
 * server as defence in depth, and shows a plain "no access" screen to members
 * who are signed in without a staff role.
 */
export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/signin?next=/crm");

  const session = await getCrmSession();
  if (!session) {
    return (
      <main className="text-ink flex min-h-dvh items-center justify-center bg-[#f7f6fb] px-4 font-[family-name:var(--font-jakarta)]">
        <div className="max-w-md rounded-2xl border border-[#ece9f5] bg-white p-8 text-center shadow-sm">
          <span className="bg-brand-50 text-brand-700 mx-auto flex size-12 items-center justify-center rounded-full">
            <ShieldAlert aria-hidden className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold">The CRM is for staff only</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account doesn&apos;t have access. If you need it, ask an
            administrator to give you the Sales Manager or Management role.
          </p>
          <Link
            href="/dashboard"
            className="bg-brand-700 hover:bg-brand-800 mt-6 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Back to your dashboard
          </Link>
        </div>
      </main>
    );
  }

  const [waiting, due] = await Promise.all([
    reviewCount(),
    myDueCount(member.id),
  ]);

  return (
    <CrmShell
      name={member.fullName ?? ""}
      email={member.email ?? ""}
      roleLabel={session.roles.map((r) => CRM_ROLE_LABEL[r]).join(" · ")}
      showAdminLink={session.roles.includes("operations")}
      reviewCount={waiting ?? 0}
      tasksDue={due ?? 0}
    >
      {children}
    </CrmShell>
  );
}
