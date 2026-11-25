import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCrmSession } from "@/lib/crm/session";
import { Card } from "@/components/crm/ui";

export const metadata: Metadata = { title: "How to use the CRM" };

type Section = { id: string; title: string; body: React.ReactNode };

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-brand-700 font-semibold hover:underline">
    {children}
  </Link>
);

const SECTIONS: Section[] = [
  {
    id: "what",
    title: "What the CRM is for",
    body: (
      <>
        <p>
          One place for everyone we deal with: ETEN members, Mentorship users,
          leads from our ads, Women in Tech, and Expervia&apos;s business
          customers. Each person has one record with everything about them.
        </p>
        <p>
          It fills itself in. New sign-ups appear automatically, Mentorship
          bookings and payments show on people&apos;s timelines, and Women in
          Tech contributor enquiries arrive with a follow-up task. Your job is
          to add what only people know: calls, meetings, notes and next steps.
        </p>
      </>
    ),
  },
  {
    id: "contacts",
    title: "Finding people",
    body: (
      <>
        <p>
          <A href="/crm/contacts">Contacts</A> lists everyone. Use the tabs
          (ETEN, Customers, Women in Tech, Needs review), the search box (name,
          email or phone) and the account filter. Click a source in the table to
          see everyone from that source.
        </p>
        <p>
          <span className="font-semibold">Account</span> tells you where someone
          is: <em>Active</em> (signed in and using the platform),{" "}
          <em>Not activated</em> (we created an account, they haven&apos;t set a
          password yet) or <em>No account</em> (a lead or customer contact
          only).
        </p>
      </>
    ),
  },
  {
    id: "record",
    title: "Working on a contact",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <span className="font-semibold">Properties:</span> set the lead
          status, stage, owner and tags, then Save. Every change is noted on the
          timeline.
        </li>
        <li>
          <span className="font-semibold">Log activity</span> after every call,
          meeting or important email. Pick the outcome for calls. If it happened
          earlier, set the date and time.
        </li>
        <li>
          <span className="font-semibold">Tasks:</span> add a follow-up with a
          due date so it shows in your task list.
        </li>
        <li>
          <span className="font-semibold">Platform account</span> shows their
          membership ID, pods, mentorship and payments, straight from the
          platform.
        </li>
        <li>
          Use the Email, Call and WhatsApp buttons at the top to get in touch.
        </li>
      </ul>
    ),
  },
  {
    id: "review",
    title: "The review queue",
    body: (
      <p>
        <A href="/crm/review">Review queue</A> lists people whose phone number
        belongs to an existing account under a different email. If it is the
        same person, choose{" "}
        <span className="font-semibold">Same person, merge</span> (their history
        moves onto the existing record; this can&apos;t be undone). If not,
        choose <span className="font-semibold">Different people</span>.
      </p>
    ),
  },
  {
    id: "sales",
    title: "Companies and deals",
    body: (
      <>
        <p>
          <A href="/crm/companies">Companies</A> holds customers, prospects and
          partners. <A href="/crm/deals">Deals</A> has two pipelines: Expervia
          Sales and ETEN Partnerships.
        </p>
        <p>
          Move a deal by dragging its card, using its &ldquo;Move to&rdquo;
          menu, or the stage bar on the deal page. When a deal is lost, add the
          reason: it helps us learn. Keep the value and expected close date up
          to date, because the weighted pipeline and reports use them.
        </p>
      </>
    ),
  },
  {
    id: "tasks",
    title: "Tasks",
    body: (
      <p>
        <A href="/crm/tasks">Tasks</A> shows your open tasks, what&apos;s
        overdue or due today, and what&apos;s coming up. The number next to
        Tasks in the sidebar is your overdue and due-today count. Tick a task
        when it&apos;s done; it is noted on the person&apos;s or company&apos;s
        timeline.
      </p>
    ),
  },
  {
    id: "lists",
    title: "Lists",
    body: (
      <>
        <p>
          A <span className="font-semibold">smart list</span> is a saved filter
          (for example &ldquo;ETEN, not activated, from Facebook&rdquo;). People
          join and leave it automatically. The quickest way to make one: filter{" "}
          <A href="/crm/contacts">Contacts</A>, then choose{" "}
          <span className="font-semibold">Save as list</span>.
        </p>
        <p>
          A <span className="font-semibold">fixed list</span> holds hand-picked
          people (for example event speakers). Add someone from the Lists
          section on their record.
        </p>
      </>
    ),
  },
  {
    id: "email",
    title: "Sending email",
    body: (
      <>
        <p>
          <A href="/crm/campaigns">Email campaigns</A> send to a list. Write the
          email, check the preview, send yourself a test, then send in batches
          of 50. Only people who agreed to marketing email and haven&apos;t
          unsubscribed receive it, and nobody gets the same campaign twice.
        </p>
        <p>
          <A href="/crm/activation">Activation emails</A> invite people whose
          account we created to set a password. Their link works for 14 days.
          Reminders can go 7 days after the last email.
        </p>
        <p>
          Only operations staff can send. Check the email provider&apos;s daily
          limit before sending several batches in a day.
        </p>
      </>
    ),
  },
  {
    id: "insights",
    title: "Reports and Women in Tech",
    body: (
      <p>
        <A href="/crm/reports">Reports</A> shows how each source converts into
        active members, how sales are going and what the team logged in the last
        30 days. <A href="/crm/women-in-tech">Women in Tech</A> shows the
        community&apos;s members, growth, pods, contributor enquiries and women
        in the CRM who could be invited.
      </p>
    ),
  },
  {
    id: "data",
    title: "Looking after people's data",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Everything here is personal data. Only export a CSV when you need it,
          keep it private and delete it when you&apos;re done. Every export is
          recorded.
        </li>
        <li>
          Email people through the CRM (campaigns and activation emails) or the
          admin console&apos;s Email page: both respect unsubscribes. A separate
          tool won&apos;t.
        </li>
        <li>
          If someone asks to be removed or to see their data, tell an operations
          staff member.
        </li>
      </ul>
    ),
  },
];

export default async function HelpPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/help");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        How to use the CRM
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        A short guide for the team. Questions about access?{" "}
        <A href="/crm/team">Team & access</A> lists who can do what.
      </p>

      <nav aria-label="On this page" className="mt-6">
        <ol className="flex flex-wrap gap-2 text-sm">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="hover:border-brand-300 hover:text-brand-700 inline-flex rounded-full border border-[#e4e0f0] bg-white px-3 py-1 font-semibold text-slate-700"
              >
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-6 space-y-4">
        {SECTIONS.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-h`}
            className="scroll-mt-24"
          >
            <Card>
              <h2 id={`${s.id}-h`} className="text-ink font-semibold">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                {s.body}
              </div>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
