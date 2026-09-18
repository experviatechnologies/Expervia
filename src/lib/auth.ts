import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * ETEN member identity — the authoritative "who is this request" for the member
 * app (mirrors getCurrentManager() in @/lib/supabase-server, which the /admin
 * area uses). Reads the auth session, then the member's own members + profiles
 * rows (RLS lets a member read only their own).
 *
 * Wrapped in React's cache() so multiple calls within one server render/request
 * hit Supabase once. Use this — not getUser() alone — to gate member pages,
 * Server Actions and Route Handlers, per the Next.js data-security guidance.
 */
export type MemberIdentity = {
  id: string;
  email: string | null;
  /** Email verified — profile is only public once this (and claimedAt) is set. */
  emailConfirmed: boolean;
  role: "member" | "operations";
  status: "active" | "suspended" | "deactivated";
  origin: "self_signup" | "migrated";
  /** null = account provisioned but not yet activated (claimed). */
  claimedAt: string | null;
  fullName: string | null;
  /** ETEN readiness level 0–5 (V0–V5); set by operations. */
  vLevel: number;
};

export const getCurrentMember = cache(
  async (): Promise<MemberIdentity | null> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Own rows only (RLS). The members row is created by the on_auth_user_created
    // trigger; fall back to sane defaults if a read races that trigger.
    const [{ data: member, error: memberError }, { data: profile }] =
      await Promise.all([
        supabase
          .from("members")
          .select("role, status, origin, claimed_at, v_level")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("member_id", user.id)
          .maybeSingle(),
      ]);

    // Resilience: never let a schema hiccup (e.g. a column added by a migration
    // that hasn't run yet) silently strip a member's real role/status. If the
    // full select errored, retry with the stable columns and default v_level.
    let m = member;
    if (!m && memberError) {
      const { data: base } = await supabase
        .from("members")
        .select("role, status, origin, claimed_at")
        .eq("id", user.id)
        .maybeSingle();
      m = base ? { ...base, v_level: 0 } : null;
    }

    return {
      id: user.id,
      email: user.email ?? null,
      emailConfirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
      role: m?.role ?? "member",
      status: m?.status ?? "active",
      origin: m?.origin ?? "self_signup",
      claimedAt: m?.claimed_at ?? null,
      fullName: profile?.full_name ?? null,
      vLevel: m?.v_level ?? 0,
    };
  },
);

/** True when the signed-in user is an operations (staff) member. */
export async function isOperations(): Promise<boolean> {
  const member = await getCurrentMember();
  return member?.role === "operations";
}
