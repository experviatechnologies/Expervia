import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  getContactRecord,
  listOwners,
  type AccountSummary,
  type ContactRecord,
} from "@/lib/crm/record";
import {
  AUDIENCE_LABEL,
  COMMUNITY_LABEL,
  POD_ROLE_LABEL,
  REVIEW_LABEL,
  dateTime,
  fullName,
  initialsOf,
  money,
  shortDate,
} from "@/lib/crm/labels";
import {
  ACCOUNT_CHIP,
  AUDIENCE_CHIP,
  COMMUNITY_CHIP,
  REVIEW_CHIP,
  Card,
  Chip,
  Field,
  type AccountStatus,
} from "@/components/crm/ui";
import { PropertiesForm } from "./properties-form";
import { LogActivity } from "@/components/crm/log-activity";
import { Timeline } from "@/components/crm/timeline";

type Params = Promise<{ id: string }>;

// Personal names stay out of the browser tab title and history.
export const metadata: Metadata = { title: "Contact" };

function accountStatus(a: AccountSummary | null): AccountStatus {
  if (!a) return "none";
  return a.claimedAt ? "active" : "pending";
}

/** Digits only, for WhatsApp links (wa.me wants no plus sign). */
const waDigits = (phone: string) => phone.replace(/\D/g, "");

const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const list = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export default async function ContactRecordPage({
  params,
}: {
  params: Params;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/crm");

  const { id } = await params;
  const [contact, owners] = await Promise.all([
    getContactRecord(id),
    listOwners(),
  ]);
  if (!contact) notFound();

  const name = fullName(contact.firstName, contact.lastName);
  const status = accountStatus(contact.account);
  const isOps = session.roles.includes("operations");
  const subtitle = [
    contact.jobTitle ?? contact.account?.jobTitle,
    contact.company,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/crm/contacts"
        className="hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All contacts
      </Link>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-5 rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="bg-brand-700 flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          >
            {initialsOf(contact.firstName, contact.lastName)}
          </span>
          <div className="min-w-0">
            <h1 className="text-ink truncate text-xl font-bold tracking-tight sm:text-2xl">
              {name}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-slate-600">{subtitle}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip className={AUDIENCE_CHIP[contact.audience]}>
                {AUDIENCE_LABEL[contact.audience]}
              </Chip>
              <Chip className={ACCOUNT_CHIP[status].className}>
                {ACCOUNT_CHIP[status].label}
              </Chip>
              {contact.communities.map((k) => (
                <Chip key={k} className={COMMUNITY_CHIP}>
                  {COMMUNITY_LABEL[k] ?? k}
                </Chip>
              ))}
              {contact.reviewReason && (
                <Chip className={REVIEW_CHIP}>
                  <AlertTriangle aria-hidden className="size-3" />
                  Needs review
                </Chip>
              )}
            </div>
          </div>
        </div>
        <QuickActions contact={contact} />
      </header>

      {contact.reviewReason && (
        <div
          role="note"
          className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">
              {REVIEW_LABEL[contact.reviewReason] ?? "Needs review"}.
            </span>{" "}
            This person may already have a platform account under a different
            email address.{" "}
            <Link
              href="/crm/review"
              className="font-semibold underline hover:no-underline"
            >
              Check them in the review queue
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Left column: properties and details */}
        <div className="space-y-6">
          <Card title="Properties">
            <PropertiesForm
              contactId={contact.id}
              owners={owners}
              initial={{
                leadStatus: contact.leadStatus,
                lifecycle: contact.lifecycle,
                ownerId: contact.ownerId,
                tags: contact.tags,
              }}
            />
          </Card>
          <Details contact={contact} />
        </div>

        {/* Right column: account, logging and timeline */}
        <div className="space-y-6">
          <AccountCard account={contact.account} isOps={isOps} />
          <Card title="Log activity">
            <LogActivity target={{ kind: "contact", id: contact.id }} />
          </Card>
          <Timeline entries={contact.timeline} />
        </div>
      </div>
    </div>
  );
}

function QuickActions({ contact }: { contact: ContactRecord }) {
  const btn =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50";
  if (!contact.email && !contact.phone) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {contact.email && (
        <a href={`mailto:${contact.email}`} className={btn}>
          <Mail aria-hidden className="text-brand-600 size-4" />
          Email
        </a>
      )}
      {contact.phone && (
        <>
          <a href={`tel:${contact.phone}`} className={btn}>
            <Phone aria-hidden className="text-brand-600 size-4" />
            Call
          </a>
          <a
            href={`https://wa.me/${waDigits(contact.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
          >
            <MessageCircle aria-hidden className="text-brand-600 size-4" />
            WhatsApp
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </>
      )}
    </div>
  );
}

function Details({ contact }: { contact: ContactRecord }) {
  const e = contact.eten;
  const location = [contact.city, contact.state, contact.country]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const importedPods = list(e.pods);
  const skills = list(e.skills);
  const hasEten =
    str(e.solution_area) ||
    importedPods.length ||
    skills.length ||
    str(e.availability) ||
    str(e.partner) ||
    str(e.community_role);

  return (
    <Card title="Details">
      <dl className="divide-y divide-[#f1eef8]">
        <Field label="Email">
          {contact.email && (
            <>
              {contact.email}
              {!contact.emailOptIn && (
                <span className="block text-xs text-slate-500">
                  Opted out of marketing email
                </span>
              )}
            </>
          )}
        </Field>
        <Field label="Phone">{contact.phone}</Field>
        <Field label="Location">{location}</Field>
        <Field label="Gender">
          {contact.gender === "female"
            ? "Female"
            : contact.gender === "male"
              ? "Male"
              : null}
        </Field>
        <Field label="Source">{contact.source}</Field>
        <Field label="Company">
          {contact.company &&
            (contact.companyId ? (
              <Link
                href={`/crm/companies/${contact.companyId}`}
                className="text-brand-700 font-semibold hover:underline"
              >
                {contact.company}
              </Link>
            ) : (
              contact.company
            ))}
        </Field>
        <Field label="First seen">{shortDate(contact.firstSeenAt)}</Field>
        <Field label="Last activity">{dateTime(contact.lastActivityAt)}</Field>
      </dl>

      {hasEten && (
        <>
          <h3 className="mt-5 mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            From the ETEN registry
          </h3>
          <dl className="divide-y divide-[#f1eef8]">
            <Field label="Solution area">{str(e.solution_area)}</Field>
            <Field label="Community role">{str(e.community_role)}</Field>
            <Field label="Pods">{importedPods.join(", ")}</Field>
            <Field label="Skills">{skills.join(", ")}</Field>
            <Field label="Availability">{str(e.availability)}</Field>
            <Field label="Partner">{str(e.partner)}</Field>
          </dl>
        </>
      )}
    </Card>
  );
}

function AccountCard({
  account,
  isOps,
}: {
  account: AccountSummary | null;
  isOps: boolean;
}) {
  if (!account) {
    return (
      <Card title="Platform account">
        <p className="text-sm text-slate-600">
          This person has no account on the platform. Customer leads, people
          waiting for review and people with no email address are kept as CRM
          contacts only.
        </p>
      </Card>
    );
  }

  const status =
    account.status !== "active"
      ? account.status === "suspended"
        ? "Suspended"
        : "Deactivated"
      : account.claimedAt
        ? `Active since ${shortDate(account.claimedAt)}`
        : "Created, waiting for them to activate it";

  const bookings = account.bookingsAsMentee + account.bookingsAsMentor;

  return (
    <Card
      title="Platform account"
      action={
        isOps ? (
          <Link
            href={`/admin/members/${account.memberId}`}
            className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Open in admin
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        ) : null
      }
    >
      <div className="grid gap-x-8 sm:grid-cols-2">
        <dl className="divide-y divide-[#f1eef8]">
          <Field label="Status">{status}</Field>
          <Field label="Membership ID">{account.membershipId}</Field>
          <Field label="Account created">
            {account.origin === "migrated"
              ? `${shortDate(account.joinedAt)} (by staff)`
              : shortDate(account.joinedAt)}
          </Field>
          <Field label="Last signed in">
            {account.lastSignInAt ? dateTime(account.lastSignInAt) : "Never"}
          </Field>
          <Field label="Signed up via">
            {account.signupSource === "mentorship" ? "Mentorship" : "ETEN"}
          </Field>
        </dl>
        <dl className="divide-y divide-[#f1eef8]">
          <Field label="Readiness level">{`V${account.vLevel}`}</Field>
          <Field label="Pods">
            {account.pods.length > 0 && (
              <ul className="space-y-0.5">
                {account.pods.map((p) => (
                  <li key={p.name}>
                    {p.name}
                    {p.role !== "member" && (
                      <span className="text-slate-500">
                        {" "}
                        ({POD_ROLE_LABEL[p.role]})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Mentorship">
            {account.mentorStatus
              ? `Mentor (${account.mentorStatus})`
              : account.mentorshipIntent === "mentee"
                ? "Mentee"
                : account.mentorshipIntent === "mentor"
                  ? "Wants to mentor"
                  : null}
          </Field>
          <Field label="Sessions booked">
            {bookings > 0
              ? `${bookings}${account.lastBookingAt ? `, latest ${shortDate(account.lastBookingAt)}` : ""}`
              : "None"}
          </Field>
          <Field label="Payments">
            {account.paid.length > 0
              ? account.paid
                  .map((p) => `${money(p.amount, p.currency)} (${p.count})`)
                  .join(", ")
              : "None"}
          </Field>
        </dl>
      </div>
    </Card>
  );
}
