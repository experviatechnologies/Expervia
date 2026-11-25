import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmSession } from "@/lib/crm/session";
import {
  BATCH_SIZE,
  VERSION_LABEL,
  activatedAfterEmail,
  activationCandidates,
  activationEmail,
  pickBatch,
  type EmailVersion,
  type Group,
  type Mode,
} from "@/lib/crm/activation";
import { renderEmail } from "@/lib/email-template";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/crm/ui";
import { StatTile } from "@/components/crm/stat-tile";
import { SendPanel } from "./send-panel";

export const metadata: Metadata = { title: "Activation emails" };

const VERSIONS: EmailVersion[] = ["ad_lead", "registry", "general"];

export default async function ActivationPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/activation");

  const [{ candidates, unsubscribed }, activated] = await Promise.all([
    activationCandidates(),
    activatedAfterEmail(),
  ]);

  const groups: Group[] = ["ad_lead", "registry", "general", "all"];
  const counts = Object.fromEntries(
    groups.map((g) => [
      g,
      {
        first: pickBatch(candidates, g, "first").length,
        reminder: pickBatch(candidates, g, "reminder").length,
      },
    ]),
  ) as Record<Group, Record<Mode, number>>;
  const groupLabels = Object.fromEntries(
    groups.map((g) => [
      g,
      `${g === "all" ? "Everyone waiting" : VERSION_LABEL[g]} (${candidates.filter((c) => g === "all" || c.version === g).length})`,
    ]),
  ) as Record<Group, string>;
  const emailed = candidates.filter((c) => c.timesSent > 0).length;

  // Previews use a sample link; real emails get each person's own link.
  const sample = `${siteConfig.url}/auth/activate?t=example`;
  const previews = VERSIONS.map((v) => {
    const { subject, content } = activationEmail(
      "Ada Obi",
      "ada@example.com",
      sample,
      v,
    );
    return { v, subject, html: renderEmail(content).html };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        Activation emails
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Accounts we created for people (from lead forms, the registry and the
        earlier member migration) that were never activated. Each email has a
        personal link that works for 14 days and takes them straight to setting
        a password.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Waiting to activate"
          value={candidates.length}
          detail={`${unsubscribed} more unsubscribed and won't be emailed`}
        />
        <StatTile label="Never emailed" value={candidates.length - emailed} />
        <StatTile label="Emailed, not activated yet" value={emailed} />
        <StatTile
          label="Activated after an email"
          value={activated}
          detail="The emails working"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <Card title="Send">
          <SendPanel
            canSend={session.roles.includes("operations")}
            counts={counts}
            groupLabels={groupLabels}
            batchSize={BATCH_SIZE}
          />
          <p className="mt-5 border-t border-[#f1eef8] pt-4 text-xs text-slate-500">
            Emails go out in batches of {BATCH_SIZE}, about one a second. Check
            your email provider&apos;s daily sending limit before sending
            several batches in one day. Each send is noted on the person&apos;s
            timeline, and people who unsubscribed are always left out.
          </p>
        </Card>

        <Card title="What they receive">
          <div className="space-y-6">
            {previews.map((p) => (
              <details key={p.v} open={p.v === "ad_lead"} className="group">
                <summary className="text-ink cursor-pointer text-sm font-semibold">
                  {VERSION_LABEL[p.v]}
                  <span className="ml-2 font-normal text-slate-500">
                    Subject: {p.subject}
                  </span>
                </summary>
                <iframe
                  title={`Email preview: ${VERSION_LABEL[p.v]}`}
                  srcDoc={p.html}
                  sandbox=""
                  className="mt-3 h-[34rem] w-full rounded-xl border border-[#ece9f5] bg-white"
                />
              </details>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
