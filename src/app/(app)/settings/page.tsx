import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  NotificationPreferences,
  type PrefCategory,
} from "./notification-preferences";
import { BlockedMembers, type BlockedRow } from "./blocked-members";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const CATEGORIES: { key: PrefCategory; label: string; hint: string }[] = [
  {
    key: "comment",
    label: "Comments",
    hint: "When someone comments on your post or replies to you",
  },
  {
    key: "reaction",
    label: "Reactions",
    hint: "When someone reacts to your post or comment",
  },
  {
    key: "message",
    label: "Messages",
    hint: "When someone sends you a direct message",
  },
];

export default async function SettingsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const [{ data: prefRows }, { data: blockRows }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("category, mode")
      .eq("member_id", member.id),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", member.id),
  ]);

  // Default is "realtime" (on) when no row exists.
  const modeByCategory = new Map(
    (prefRows ?? []).map((p) => [p.category, p.mode]),
  );
  const prefs = CATEGORIES.map((c) => ({
    ...c,
    enabled: (modeByCategory.get(c.key) ?? "realtime") !== "off",
  }));

  const blockedIds = (blockRows ?? []).map((b) => b.blocked_id);
  const { data: blockedNames } = blockedIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", blockedIds)
    : { data: [] };
  const nameById = new Map(
    (blockedNames ?? []).map((n) => [n.member_id, n.full_name]),
  );
  const blocked: BlockedRow[] = blockedIds.map((id) => ({
    memberId: id,
    name: nameById.get(id) ?? "A member",
  }));

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/profile"
          className="text-eten-ink-muted hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to profile
        </Link>
        <h1 className="font-display text-headline-md text-eten-ink font-bold">
          Settings
        </h1>
      </header>

      <section className="bg-eten-panel border-eten-line mb-6 rounded-2xl border p-6">
        <h2 className="font-display text-body-lg text-eten-ink mb-1 font-bold">
          Notifications
        </h2>
        <p className="text-eten-ink-muted mb-5 text-sm">
          Choose what shows up in your notifications.
        </p>
        <NotificationPreferences prefs={prefs} />
      </section>

      <section className="bg-eten-panel border-eten-line rounded-2xl border p-6">
        <h2 className="font-display text-body-lg text-eten-ink mb-1 font-bold">
          Blocked members
        </h2>
        <p className="text-eten-ink-muted mb-5 text-sm">
          Blocked members can&apos;t message you, and you can&apos;t message
          them.
        </p>
        <BlockedMembers blocked={blocked} />
      </section>
    </div>
  );
}
