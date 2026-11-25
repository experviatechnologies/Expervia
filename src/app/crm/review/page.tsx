import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  listReviewItems,
  type ReviewItem,
  type ReviewPerson,
} from "@/lib/crm/review";
import { AUDIENCE_LABEL, REVIEW_LABEL, shortDate } from "@/lib/crm/labels";
import { AUDIENCE_CHIP, Card, Chip } from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { DecisionButtons } from "./decision-buttons";

export const metadata: Metadata = { title: "Review queue" };

/** Compare two values loosely (case, spaces, phone formatting). */
const same = (a: string | null, b: string | null) => {
  if (!a || !b) return false;
  const norm = (v: string) => v.toLowerCase().replace(/[\s+()-]/g, "");
  const x = norm(a);
  const y = norm(b);
  return (
    x === y ||
    (x.length >= 10 && y.length >= 10 && x.slice(-10) === y.slice(-10))
  );
};

function PersonColumn({
  heading,
  person,
  other,
  extra,
}: {
  heading: string;
  person: ReviewPerson;
  other: ReviewPerson | null;
  extra?: React.ReactNode;
}) {
  const rows: [string, string | null, boolean][] = [
    ["Name", person.name, same(person.name, other?.name ?? null)],
    ["Email", person.email, same(person.email, other?.email ?? null)],
    ["Phone", person.phone, same(person.phone, other?.phone ?? null)],
    ["Location", person.location, false],
    ["Source", person.source, false],
    [
      "First seen",
      person.firstSeenAt ? shortDate(person.firstSeenAt) : null,
      false,
    ],
  ];
  return (
    <div className="min-w-0 rounded-xl border border-[#ece9f5] bg-[#fbfaff] p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {heading}
      </p>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, value, match]) => (
          <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2">
            <dt className="text-slate-500">{label}</dt>
            <dd
              className={cn(
                "min-w-0 break-words",
                value ? "text-ink" : "text-slate-400",
                match && "font-semibold",
              )}
            >
              {value ?? "Not recorded"}
              {match && <span className="sr-only"> (matches)</span>}
            </dd>
          </div>
        ))}
      </dl>
      {extra}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const { lead, match } = item;
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-ink font-semibold">
            <Link
              href={`/crm/contacts/${item.contactId}`}
              className="hover:text-brand-700 hover:underline"
            >
              {lead.name}
            </Link>
          </h2>
          <Chip className={AUDIENCE_CHIP[lead.audience]}>
            {AUDIENCE_LABEL[lead.audience]}
          </Chip>
        </div>
        <p className="text-sm text-slate-600">
          {REVIEW_LABEL[item.reason] ?? "Needs review"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PersonColumn
          heading="This contact"
          person={lead}
          other={match?.person ?? null}
        />
        {match ? (
          <PersonColumn
            heading="Existing account"
            person={match.person}
            other={lead}
            extra={
              <p className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#ece9f5] pt-3 text-xs text-slate-600">
                <span>
                  {match.membershipId ? `${match.membershipId} · ` : ""}
                  {match.activated ? "Active account" : "Not activated yet"}
                </span>
                {match.contactId && (
                  <Link
                    href={`/crm/contacts/${match.contactId}`}
                    className="text-brand-700 inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    Open record
                    <ExternalLink aria-hidden className="size-3" />
                  </Link>
                )}
              </p>
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[#e4e0f0] p-4 text-sm text-slate-600">
            The account this phone number belonged to no longer exists. Mark
            them as different people to clear the flag.
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Matching details are in bold.
      </p>

      <div className="mt-4">
        <DecisionButtons
          contactId={item.contactId}
          canMerge={Boolean(match)}
          leadName={lead.name}
          matchName={match?.person.name ?? ""}
        />
      </div>
    </Card>
  );
}

export default async function ReviewPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/review");

  const items = await listReviewItems();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        Review queue
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        These people share a phone number with an existing account but used a
        different email. Check each one. If it&apos;s the same person, merge the
        records so they keep one account. If not, mark them as different people
        so they can get their own account later.
      </p>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 aria-hidden className="size-10 text-emerald-600" />
              <h2 className="text-ink mt-3 font-semibold">All caught up</h2>
              <p className="mt-1 text-sm text-slate-600">
                Nobody is waiting for review.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <p className="text-ink text-sm font-semibold" role="status">
              {items.length} {items.length === 1 ? "person" : "people"} to check
            </p>
            {items.map((item) => (
              <ReviewCard key={item.contactId} item={item} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
