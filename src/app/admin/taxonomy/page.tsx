import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";
import { TaxonomyManager, type PodBlock } from "./taxonomy-manager";

export const metadata: Metadata = {
  title: "Skills Taxonomy",
  robots: { index: false, follow: false },
};

export default async function TaxonomyPage() {
  // Defence-in-depth: proxy already gates /admin, but re-verify here — and this
  // page requires the operations role specifically, not just any signed-in user.
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const [{ data: podRows }, { data: skillRows }] = await Promise.all([
    admin
      .from("pods")
      .select("id, name, slug, is_main")
      .order("is_main", { ascending: false })
      .order("name"),
    admin
      .from("skills")
      .select("id, name, slug, is_active, pod_id")
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
  ]);

  // Group skills under their pod, preserving pod order (main first).
  const byPod = new Map<string, PodBlock["skills"]>();
  for (const s of skillRows ?? []) {
    const list = byPod.get(s.pod_id) ?? [];
    list.push({
      id: s.id,
      name: s.name,
      slug: s.slug,
      isActive: s.is_active,
    });
    byPod.set(s.pod_id, list);
  }

  const pods: PodBlock[] = (podRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    isMain: p.is_main,
    skills: byPod.get(p.id) ?? [],
  }));

  const totalSkills = skillRows?.length ?? 0;

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-5xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Skills Taxonomy
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {totalSkills} skill{totalSkills === 1 ? "" : "s"} across{" "}
            {pods.length} pod{pods.length === 1 ? "" : "s"}. Members pick these
            during onboarding and on their profile.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="taxonomy" />

      <TaxonomyManager pods={pods} />
    </div>
  );
}
