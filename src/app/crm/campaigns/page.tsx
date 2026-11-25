import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  CampaignsNotReady,
  listCampaigns,
  type Campaign,
} from "@/lib/crm/campaigns";
import { ListsNotReady, listLists } from "@/lib/crm/lists";
import { shortDate } from "@/lib/crm/labels";
import { Card, Chip } from "@/components/crm/ui";
import { NewCampaign } from "./new-campaign";

export const metadata: Metadata = { title: "Email campaigns" };

const STATUS: Record<Campaign["status"], { label: string; className: string }> =
  {
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-600 ring-slate-500/15",
    },
    sending: {
      label: "Sending",
      className: "bg-amber-50 text-amber-800 ring-amber-600/20",
    },
    sent: {
      label: "Sent",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    },
  };

function Setup({ file }: { file: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight">
        Email campaigns
      </h1>
      <Card className="mt-6">
        <p className="text-sm text-slate-700">
          Campaigns aren&apos;t set up yet. Run{" "}
          <code className="bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">
            supabase/eten/{file}
          </code>{" "}
          in the Supabase SQL Editor, then reload this page.
        </p>
      </Card>
    </div>
  );
}

export default async function CampaignsPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/campaigns");

  let campaigns: Campaign[];
  let lists;
  try {
    [campaigns, lists] = await Promise.all([listCampaigns(), listLists()]);
  } catch (e) {
    if (e instanceof ListsNotReady) return <Setup file="66_crm_lists.sql" />;
    if (e instanceof CampaignsNotReady)
      return <Setup file="71_crm_campaigns.sql" />;
    throw e;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Email campaigns
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Emails to a CRM list. Only people who agreed to marketing email and
            haven&apos;t unsubscribed receive them, and nobody gets the same
            campaign twice.
          </p>
        </div>
        <NewCampaign
          lists={lists.map((l) => ({ id: l.id, name: l.name, size: l.size }))}
        />
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-6">
          <div className="flex flex-col items-center py-8 text-center">
            <span className="bg-brand-50 text-brand-700 flex size-12 items-center justify-center rounded-full">
              <Mail aria-hidden className="size-6" />
            </span>
            <h2 className="text-ink mt-4 font-semibold">No campaigns yet</h2>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              Make a list of who it&apos;s for in Lists, then start a campaign
              here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#ece9f5] bg-white shadow-[0_1px_2px_rgba(23,19,35,0.04)]">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Email campaigns</caption>
            <thead className="border-b border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Campaign
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-2.5 md:table-cell">
                  List
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Sent
                </th>
                <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">
                  Last sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef8]">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-[#fbfaff]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/campaigns/${c.id}`}
                      className="text-ink hover:text-brand-700 font-semibold hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.subject && (
                      <p className="max-w-[24rem] truncate text-xs text-slate-500">
                        {c.subject}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Chip className={STATUS[c.status].className}>
                      {STATUS[c.status].label}
                    </Chip>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {c.listName ?? "No list"}
                  </td>
                  <td className="text-ink px-4 py-3 text-right font-semibold tabular-nums">
                    {c.sentCount}
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-slate-600 sm:table-cell">
                    {c.lastSentAt ? shortDate(c.lastSentAt) : "Not yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
