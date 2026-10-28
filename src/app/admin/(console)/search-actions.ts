"use server";

import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SearchResult } from "@/components/shared/global-search";

/**
 * Admin global search: jump to a member or a pod by name. Operations-only
 * (the whole console already is), and the service_role read is gated behind
 * that check. Kept intentionally small and index-friendly (name prefixes).
 */
export async function adminSearch(qRaw: string): Promise<SearchResult[]> {
  const q = (qRaw ?? "").trim();
  if (q.length < 2) return [];
  if (!(await isOperations())) return [];

  const admin = getSupabaseAdmin();
  const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;

  const [{ data: members }, { data: pods }] = await Promise.all([
    admin
      .from("profiles")
      .select("member_id, full_name, headline")
      .ilike("full_name", like)
      .limit(6),
    admin.from("pods").select("slug, name").ilike("name", like).limit(4),
  ]);

  const results: SearchResult[] = [];
  for (const m of members ?? []) {
    results.push({
      label: m.full_name,
      sub: (m.headline as string | null) || "Member",
      href: `/admin/members/${m.member_id}`,
      kind: "Member",
    });
  }
  for (const p of pods ?? []) {
    results.push({
      label: p.name,
      sub: "Pod",
      href: `/admin/pods/${p.slug}`,
      kind: "Pod",
    });
  }
  return results;
}
