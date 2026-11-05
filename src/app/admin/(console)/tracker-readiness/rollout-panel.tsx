import { getSupabaseAdmin } from "@/lib/supabase";
import { RolloutControl } from "./rollout-control";

/** Loads the rollout switch and specialist pods for RolloutControl. */
export async function RolloutPanel() {
  const admin = getSupabaseAdmin();
  const [settings, pods, members] = await Promise.all([
    admin
      .from("presales_settings")
      .select("rollout_stage, pilot_pod_ids")
      .eq("id", true)
      .maybeSingle(),
    admin.from("pods").select("id, name").eq("is_main", false).order("name"),
    admin.from("presales_profiles").select("member_id"),
  ]);
  if (settings.error) {
    return (
      <p className="text-eten-ink-muted text-sm">
        The rollout switch needs migration <code>57_presales_rollout.sql</code>.
        Until it is run, no weekly availability emails go out.
      </p>
    );
  }
  const engineerIds = new Set(
    (members.data ?? []).map((m) => m.member_id as string),
  );
  // Engineers in each pod (members with a presales profile), paged past 1000.
  // Ids, not counts: many engineers are in two or more pods.
  const byPod = new Map<string, string[]>();
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("pod_memberships")
      .select("pod_id, member_id")
      .order("member_id")
      .order("pod_id")
      .range(from, from + 999);
    for (const r of data ?? []) {
      if (!engineerIds.has(r.member_id as string)) continue;
      const list = byPod.get(r.pod_id as string) ?? [];
      list.push(r.member_id as string);
      byPod.set(r.pod_id as string, list);
    }
    if (!data || data.length < 1000) break;
  }
  return (
    <RolloutControl
      stage={
        (settings.data?.rollout_stage as "staff" | "pilot" | "everyone") ??
        "staff"
      }
      pilotPodIds={(settings.data?.pilot_pod_ids as string[]) ?? []}
      pods={(pods.data ?? []).map((p) => ({
        id: p.id as string,
        name: p.name as string,
        memberIds: byPod.get(p.id as string) ?? [],
      }))}
      totalEngineers={engineerIds.size}
    />
  );
}
