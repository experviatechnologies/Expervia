import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  CAMPAIGN_BATCH,
  CampaignsNotReady,
  campaignAudience,
  getCampaign,
} from "@/lib/crm/campaigns";
import { listLists } from "@/lib/crm/lists";
import { shortDate } from "@/lib/crm/labels";
import { Card } from "@/components/crm/ui";
import { CampaignEditor } from "./campaign-editor";
import { CampaignSend } from "./campaign-send";

export const metadata: Metadata = { title: "Campaign" };

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <dt className="text-slate-600">
        {label}
        {note && <span className="block text-xs text-slate-400">{note}</span>}
      </dt>
      <dd className="text-ink font-semibold tabular-nums">
        {value.toLocaleString("en-GB")}
      </dd>
    </div>
  );
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/campaigns");
  const { id } = await params;

  let campaign;
  try {
    campaign = await getCampaign(id);
  } catch (e) {
    if (e instanceof CampaignsNotReady) redirect("/crm/campaigns");
    throw e;
  }
  if (!campaign) notFound();

  const [lists, audience] = await Promise.all([
    listLists(),
    campaignAudience(campaign),
  ]);
  const problem = !campaign.listId
    ? "choose which list it goes to."
    : !audience
      ? "its list no longer exists. Choose another."
      : !campaign.subject.trim()
        ? "add a subject line and save."
        : !campaign.body.trim()
          ? "write the message and save."
          : null;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/crm/campaigns"
        className="hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All campaigns
      </Link>
      <h1 className="text-ink mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {campaign.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {campaign.status === "draft"
          ? "Draft. Nothing has been sent."
          : `${campaign.sentCount} sent so far${campaign.firstSentAt ? `, starting ${shortDate(campaign.firstSentAt)}` : ""}.`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Email">
          <CampaignEditor
            key={campaign.updatedAt}
            id={campaign.id}
            locked={campaign.status !== "draft"}
            lists={lists.map((l) => ({ id: l.id, name: l.name }))}
            initial={{
              name: campaign.name,
              listId: campaign.listId,
              subject: campaign.subject,
              preview: campaign.preview,
              body: campaign.body,
              ctaLabel: campaign.ctaLabel ?? "",
              ctaUrl: campaign.ctaUrl ?? "",
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card title="Who gets it">
            {audience ? (
              <dl className="divide-y divide-[#f1eef8]">
                <Row
                  label={`On “${campaign.listName}”`}
                  value={audience.onList}
                />
                <Row label="Already sent" value={audience.alreadySent} />
                <Row label="No email address" value={audience.noEmail} />
                <Row
                  label="Not opted in to marketing email"
                  value={audience.notOptedIn}
                />
                <Row label="Unsubscribed" value={audience.unsubscribed} />
                <Row
                  label="Still to send"
                  value={audience.remaining.length}
                  note="Updates as the list changes"
                />
              </dl>
            ) : (
              <p className="text-sm text-slate-600">Choose a list and save.</p>
            )}
          </Card>
          <Card title="Send">
            <CampaignSend
              id={campaign.id}
              canSend={session.roles.includes("operations")}
              remaining={audience?.remaining.length ?? 0}
              batchSize={CAMPAIGN_BATCH}
              problem={problem}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
