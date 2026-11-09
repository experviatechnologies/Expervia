import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canExportPodRoster } from "@/lib/eten/member-access";
import { buildPodRosterCsv } from "@/lib/eten/roster-export";
import { writeAudit } from "@/lib/eten/audit";

/**
 * Download a pod's roster as CSV: its Pod Leaders (lead or backup) and ETEN
 * staff only. Built on the server so each export is checked and recorded in
 * the audit log (it carries members' phone numbers).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.redirect(
      new URL(
        `/signin?next=${encodeURIComponent(`/pods/${slug}`)}`,
        request.url,
      ),
    );
  }
  const { data: pod } = await getSupabaseAdmin()
    .from("pods")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!pod)
    return NextResponse.json({ error: "Pod not found." }, { status: 404 });
  if (!(await canExportPodRoster(viewer, pod.id as string))) {
    return NextResponse.json(
      {
        error:
          "Only this pod's leaders and ETEN staff can download its roster.",
      },
      { status: 403 },
    );
  }

  const { csv, count } = await buildPodRosterCsv(
    pod.id as string,
    request.nextUrl.origin,
  );
  await writeAudit({
    actorId: viewer.id,
    action: "pod.roster_exported",
    targetType: "pod",
    targetId: pod.id as string,
    metadata: { members: count },
  });

  const date = new Date().toISOString().slice(0, 10);
  // A UTF-8 byte-order mark so Excel shows names with accents correctly.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${pod.slug}-members-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
