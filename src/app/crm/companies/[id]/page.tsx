import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Globe, Phone, Users } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import { getCompanyRecord } from "@/lib/crm/companies";
import { listOwners } from "@/lib/crm/record";
import {
  COMPANY_TYPE_LABEL,
  LEAD_STATUS_LABEL,
  shortDate,
} from "@/lib/crm/labels";
import { COMPANY_TYPE_CHIP, Card, Chip } from "@/components/crm/ui";
import { LogActivity } from "@/components/crm/log-activity";
import { Timeline } from "@/components/crm/timeline";
import { tasksFor } from "@/lib/crm/tasks";
import { TaskForm } from "@/components/crm/task-form";
import { TaskList } from "@/components/crm/task-list";
import { CompanyForm } from "../company-form";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/companies");

  const { id } = await params;
  const [company, owners, tasks] = await Promise.all([
    getCompanyRecord(id),
    listOwners(),
    tasksFor({ kind: "company", id }),
  ]);
  if (!company) notFound();

  const location = [company.city, company.country].filter(Boolean).join(", ");
  const btn =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50";

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/crm/companies"
        className="hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All companies
      </Link>

      <header className="mt-4 flex flex-col gap-5 rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="bg-brand-700 flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          >
            {company.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-ink truncate text-xl font-bold tracking-tight sm:text-2xl">
              {company.name}
            </h1>
            <p className="truncate text-sm text-slate-600">
              {[company.industry, location].filter(Boolean).join(" · ") ||
                `Added ${shortDate(company.createdAt)}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip className={COMPANY_TYPE_CHIP[company.type]}>
                {COMPANY_TYPE_LABEL[company.type]}
              </Chip>
              <Chip className="bg-slate-100 text-slate-600 ring-slate-500/15">
                <Users aria-hidden className="size-3" />
                {company.contacts}{" "}
                {company.contacts === 1 ? "contact" : "contacts"}
              </Chip>
            </div>
          </div>
        </div>
        {(company.domain || company.phone) && (
          <div className="flex flex-wrap gap-2">
            {company.domain && (
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={btn}
              >
                <Globe aria-hidden className="text-brand-600 size-4" />
                Website
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            {company.phone && (
              <a href={`tel:${company.phone}`} className={btn}>
                <Phone aria-hidden className="text-brand-600 size-4" />
                Call
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <Card title="Company details">
          <CompanyForm
            companyId={company.id}
            owners={owners}
            initial={{
              name: company.name,
              type: company.type,
              industry: company.industry ?? "",
              domain: company.domain ?? "",
              phone: company.phone ?? "",
              city: company.city ?? "",
              country: company.country ?? "",
              description: company.description ?? "",
              ownerId: company.ownerId,
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card title="People">
            {company.people.length === 0 ? (
              <p className="text-sm text-slate-600">
                No contacts are linked to this company yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#f1eef8]">
                {company.people.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/crm/contacts/${p.id}`}
                        className="text-ink hover:text-brand-700 font-semibold hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {[p.jobTitle, p.email].filter(Boolean).join(" · ") ||
                          "No details"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {LEAD_STATUS_LABEL[
                        p.leadStatus as keyof typeof LEAD_STATUS_LABEL
                      ] ?? p.leadStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {tasks && (
            <Card title="Tasks">
              <TaskList
                tasks={tasks}
                showRelated={false}
                showAssignee
                empty="No tasks for this company yet."
              />
              <details className="mt-4 border-t border-[#f1eef8] pt-4">
                <summary className="text-brand-700 cursor-pointer text-sm font-semibold hover:underline">
                  Add a task
                </summary>
                <div className="mt-3">
                  <TaskForm
                    owners={owners}
                    meId={session.member.id}
                    fixed={{
                      kind: "company",
                      id: company.id,
                      label: company.name,
                    }}
                  />
                </div>
              </details>
            </Card>
          )}
          <Card title="Log activity">
            <LogActivity target={{ kind: "company", id: company.id }} />
          </Card>
          <Timeline entries={company.timeline} />
        </div>
      </div>
    </div>
  );
}
