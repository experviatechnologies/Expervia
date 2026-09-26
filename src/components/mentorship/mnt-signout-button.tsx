"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Sign-out control for the mentorship dashboards. Ends the Supabase session and
 * returns to the mentorship sign-in page. Used in the desktop rail's account
 * block (icon only) and the mobile drawer (with a label).
 */
export function MntSignOutButton({
  withLabel = false,
}: {
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/mentorship/signin");
    router.refresh();
  }

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="text-mnt-ink-muted hover:text-mnt-ink flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold transition-colors hover:bg-white/[0.03] disabled:opacity-50"
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        {loading ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      aria-label="Sign out"
      title="Sign out"
      className="text-mnt-faint hover:text-mnt-ink grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-white/[0.03] disabled:opacity-50"
    >
      <LogOut className="size-4" />
    </button>
  );
}
