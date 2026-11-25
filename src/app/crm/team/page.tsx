import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, CircleDashed, ExternalLink, Minus } from "lucide-react";
import { CRM_ROLE_LABEL, getCrmSession, type CrmRole } from "@/lib/crm/session";
import { listCrmStaff, setupStatus } from "@/lib/crm/team";
import { dateTime } from "@/lib/crm/labels";
import { mainSiteUrl } from "@/lib/crm/host";
import { Card } from "@/components/crm/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Team & access" };

const ROLES: CrmRole[] = ["operations", "sales_manager", "management"];

/** What each role can do in the CRM (enforced on the server). */
const PERMISSIONS: { what: string; allowed: CrmRole[] }[] = [
  {
    what: "See contacts, companies, deals, lists, tasks and reports",
    allowed: ROLES,
  },
  {
    what: "Edit contacts, companies and deals, log calls and notes",
    allowed: ROLES,
  },
  { what: "Create lists, tasks and campaign drafts", allowed: ROLES },
  { what: "Merge duplicates in the review queue", allowed: ROLES },
  { what: "Export CSV files (each export is audited)", allowed: ROLES },
  {
    what: "Send activation emails and email campaigns",
    allowed: ["operations"],
  },
  {
    what: "Give or remove CRM access (in the admin console)",
    allowed: ["operations"],
  },
];

export default async function TeamPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/team");
  const isOps = session.roles.includes("operations");
  const [staff, setup] = await Promise.all([
    listCrmStaff(),
    isOps ? setupStatus() : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        Team & access
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Who can use the CRM and what they can do. Access comes from a staff role
        on the person&apos;s platform account.
      </p>

      <Card
        title={`People with access (${staff.length})`}
        className="mt-6"
        action={
          isOps ? (
            <Link
              href={mainSiteUrl("/admin/members")}
              className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              Give or remove access
              <ExternalLink aria-hidden className="size-3.5" />
            </Link>
          ) : null
        }
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">People with CRM access</caption>
            <thead className="border-y border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5">
                  Person
                </th>
                <th scope="col" className="px-5 py-2.5">
                  Role
                </th>
                <th scope="col" className="px-5 py-2.5 text-right">
                  Contacts owned
                </th>
                <th scope="col" className="px-5 py-2.5 text-right">
                  Open deals
                </th>
                <th scope="col" className="px-5 py-2.5 text-right">
                  Open tasks
                </th>
                <th scope="col" className="hidden px-5 py-2.5 md:table-cell">
                  Last signed in
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef8]">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="text-ink font-semibold">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.email ?? "No email"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {s.roles.map((r) => CRM_ROLE_LABEL[r]).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <Link
                      href={`/crm/contacts?owner=${s.id}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {s.contactsOwned}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {s.openDeals ?? "–"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {s.openTasks ?? "–"}
                  </td>
                  <td className="hidden px-5 py-3 whitespace-nowrap text-slate-600 md:table-cell">
                    {s.lastSignInAt ? dateTime(s.lastSignInAt) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          To give someone access: in the admin console open{" "}
          <span className="font-semibold">Members</span>, find the person, and
          under <span className="font-semibold">Staff roles</span> give them
          Sales Manager or Management (a reason is recorded). Operations staff
          have access already.
        </p>
      </Card>

      <Card title="What each role can do" className="mt-6">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Permissions by role</caption>
            <thead className="border-y border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5">
                  Can
                </th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="px-5 py-2.5 text-center">
                    {CRM_ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef8]">
              {PERMISSIONS.map((p) => (
                <tr key={p.what}>
                  <th
                    scope="row"
                    className="text-ink px-5 py-3 text-left font-normal"
                  >
                    {p.what}
                  </th>
                  {ROLES.map((r) => {
                    const yes = p.allowed.includes(r);
                    return (
                      <td key={r} className="px-5 py-3 text-center">
                        {yes ? (
                          <Check
                            aria-label="Yes"
                            className="mx-auto size-4 text-emerald-600"
                          />
                        ) : (
                          <Minus
                            aria-label="No"
                            className="mx-auto size-4 text-slate-300"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {setup && (
        <Card title="Setup checklist" className="mt-6">
          <p className="-mt-2 mb-4 text-sm text-slate-600">
            The CRM&apos;s database files, checked against the live database
            just now. Run any pending file in the Supabase SQL Editor, in this
            order. Every file is safe to run more than once.
          </p>
          <ol className="space-y-2">
            {setup.map((s) => (
              <li key={s.file} className="flex items-start gap-3 text-sm">
                {s.done ? (
                  <Check
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  />
                ) : (
                  <CircleDashed
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                  />
                )}
                <span>
                  <code
                    className={cn(
                      "rounded px-1.5 py-0.5",
                      s.done
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-50 text-amber-900",
                    )}
                  >
                    {s.file}
                  </code>{" "}
                  <span className="text-slate-700">{s.what}</span>
                  <span
                    className={cn(
                      "ml-2 font-semibold",
                      s.done ? "text-emerald-700" : "text-amber-800",
                    )}
                  >
                    {s.done ? "Done" : "To run"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
