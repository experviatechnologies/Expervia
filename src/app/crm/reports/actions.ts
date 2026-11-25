"use server";

import { getCrmSession } from "@/lib/crm/session";
import { conversionReport, salesReport, teamReport } from "@/lib/crm/reports";
import { LEAD_STATUS_LABEL } from "@/lib/crm/labels";
import { toCsv } from "@/lib/csv";
import { writeAudit } from "@/lib/eten/audit";

export type ReportTab = "leads" | "sales" | "team";

/** CSV of one report tab. Aggregates only (no personal data), still audited. */
export async function exportReportCsv(
  tab: ReportTab,
): Promise<{ csv: string } | { error: string }> {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." };
  try {
    let csv: string;
    if (tab === "leads") {
      const r = await conversionReport();
      csv = toCsv(
        [
          "Source",
          "Contacts",
          "With an account",
          "Activated",
          "Activation rate %",
        ],
        [...r.sources, r.totals].map((s) => [
          s.source,
          s.contacts,
          s.withAccount,
          s.activated,
          (s.rate * 100).toFixed(1),
        ]),
      );
      csv +=
        "\r\n\r\n" +
        toCsv(
          ["Lead status", "Contacts"],
          r.leadStatus.map((l) => [
            LEAD_STATUS_LABEL[l.status as keyof typeof LEAD_STATUS_LABEL] ??
              l.status,
            l.count,
          ]),
        );
    } else if (tab === "sales") {
      const r = await salesReport();
      if (!r) return { error: "Deals aren't set up yet (SQL 68)." };
      csv = toCsv(
        ["Pipeline", "Stage", "Deals", "Value"],
        r.pipelines.flatMap((p) =>
          p.stages.map((s) => [
            p.label,
            s.label,
            s.count,
            s.values.join(" + "),
          ]),
        ),
      );
      csv +=
        "\r\n\r\n" +
        toCsv(
          ["Month", "Won", "Lost", "Value won"],
          r.months.map((m) => [m.label, m.won, m.lost, m.wonValue.join(" + ")]),
        );
      csv +=
        "\r\n\r\n" +
        toCsv(
          ["Owner", "Open", "Won", "Lost", "Value won", "Open value"],
          r.leaderboard.map((o) => [
            o.name,
            o.open,
            o.won,
            o.lost,
            o.wonValue.join(" + "),
            o.openValue.join(" + "),
          ]),
        );
    } else if (tab === "team") {
      const r = await teamReport();
      csv = toCsv(
        [
          "Staff",
          "Notes",
          "Calls",
          "Meetings",
          "Emails",
          "Other updates",
          "Tasks done",
          "Tasks overdue",
        ],
        r.map((t) => [
          t.name,
          t.notes,
          t.calls,
          t.meetings,
          t.emails,
          t.updates,
          t.tasksDone,
          t.tasksOverdue ?? "",
        ]),
      );
    } else {
      return { error: "Unknown report." };
    }
    await writeAudit({
      actorId: session.member.id,
      action: "crm.report_exported",
      targetType: "crm_report",
      targetId: null,
      metadata: { tab },
    });
    return { csv };
  } catch {
    return { error: "Couldn't build the export. Please try again." };
  }
}
