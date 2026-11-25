import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetch-all";
import { listAllContacts, type ContactRow } from "@/lib/crm/contacts";
import { getList } from "@/lib/crm/lists";
import { isUuid } from "@/lib/crm/record";
import { greetingFor, type EmailContent } from "@/lib/email-template";
import {
  loadUnsubscribed,
  unsubscribeOneClickUrl,
  unsubscribePageUrl,
} from "@/lib/email-unsubscribe";

/**
 * CRM email campaigns (SQL 71). A campaign goes to one CRM list, in batches;
 * only contacts with an email, opted in to marketing email and not
 * unsubscribed are sent to, and nobody gets the same campaign twice.
 * Callers must have checked getCrmSession() first.
 */

export const CAMPAIGN_BATCH = 50;

export type Campaign = {
  id: string;
  name: string;
  listId: string | null;
  listName: string | null;
  subject: string;
  preview: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  status: "draft" | "sending" | "sent";
  sentCount: number;
  failedCount: number;
  firstSentAt: string | null;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class CampaignsNotReady extends Error {}

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || /crm_campaign/.test(error.message)) {
    throw new CampaignsNotReady(error.message);
  }
  throw new Error(error.message);
}

const COLUMNS =
  "id, name, list_id, subject, preview, body, cta_label, cta_url, status, sent_count, failed_count, first_sent_at, last_sent_at, created_at, updated_at, crm_lists(name)";

type Raw = {
  id: string;
  name: string;
  list_id: string | null;
  subject: string;
  preview: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  status: Campaign["status"];
  sent_count: number;
  failed_count: number;
  first_sent_at: string | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  crm_lists: { name: string } | { name: string }[] | null;
};

const toCampaign = (r: Raw): Campaign => {
  const list = Array.isArray(r.crm_lists) ? r.crm_lists[0] : r.crm_lists;
  return {
    id: r.id,
    name: r.name,
    listId: r.list_id,
    listName: list?.name ?? null,
    subject: r.subject,
    preview: r.preview,
    body: r.body,
    ctaLabel: r.cta_label,
    ctaUrl: r.cta_url,
    status: r.status,
    sentCount: r.sent_count,
    failedCount: r.failed_count,
    firstSentAt: r.first_sent_at,
    lastSentAt: r.last_sent_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

export async function listCampaigns(): Promise<Campaign[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("crm_campaigns")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  check(error);
  return ((data ?? []) as Raw[]).map(toCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("crm_campaigns")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  check(error);
  return data ? toCampaign(data as Raw) : null;
}

export type Audience = {
  /** Everyone on the list right now. */
  onList: number;
  noEmail: number;
  notOptedIn: number;
  unsubscribed: number;
  alreadySent: number;
  /** Who the next batches would go to, in order. */
  remaining: ContactRow[];
};

/** Who a campaign reaches now: its list, minus anyone who can't or shouldn't get it. */
export async function campaignAudience(c: Campaign): Promise<Audience | null> {
  if (!c.listId) return null;
  const list = await getList(c.listId);
  if (!list) return null;
  const filters =
    list.kind === "smart" ? list.filters : { ...list.filters, listId: list.id };

  const [people, unsubscribed, sent] = await Promise.all([
    listAllContacts({ ...filters, sort: "oldest" }),
    loadUnsubscribed(),
    // Only successful sends count: a failed one is retried next batch.
    fetchAllRows<{ contact_id: string }>((a, b) =>
      getSupabaseAdmin()
        .from("crm_campaign_recipients")
        .select("contact_id")
        .eq("campaign_id", c.id)
        .eq("status", "sent")
        .order("contact_id")
        .range(a, b),
    ),
  ]);
  const done = new Set((sent.data ?? []).map((r) => r.contact_id));

  const a: Audience = {
    onList: people.length,
    noEmail: 0,
    notOptedIn: 0,
    unsubscribed: 0,
    alreadySent: 0,
    remaining: [],
  };
  for (const p of people) {
    if (done.has(p.id)) a.alreadySent += 1;
    else if (!p.email) a.noEmail += 1;
    else if (unsubscribed.has(p.email.toLowerCase())) a.unsubscribed += 1;
    else if (!p.emailOptIn) a.notOptedIn += 1;
    else a.remaining.push(p);
  }
  return a;
}

/** {first_name} filled in; first names only, never the full record. */
function personalise(text: string, firstName: string) {
  return text.replace(/\{first_name\}/g, firstName.trim() || "there");
}

/** One person's email for a campaign. */
export function campaignEmail(
  c: Pick<Campaign, "subject" | "preview" | "body" | "ctaLabel" | "ctaUrl">,
  person: { firstName: string; email: string },
): { subject: string; content: EmailContent } {
  const paragraphs = c.body
    .split(/\n\s*\n/)
    .map((p) =>
      personalise(p.replace(/\s*\n\s*/g, " ").trim(), person.firstName),
    )
    .filter(Boolean);
  return {
    subject: personalise(c.subject, person.firstName),
    content: {
      brand: "eten",
      preview: personalise(c.preview, person.firstName),
      greeting: greetingFor(person.firstName),
      paragraphs: paragraphs.length ? paragraphs : [""],
      ...(c.ctaLabel && c.ctaUrl
        ? { cta: { label: c.ctaLabel, url: c.ctaUrl } }
        : {}),
      reason:
        "You're receiving this because you're in touch with Expervia and the ETEN community.",
      unsubscribe: {
        pageUrl: unsubscribePageUrl(person.email),
        oneClickUrl: unsubscribeOneClickUrl(person.email),
      },
    },
  };
}
