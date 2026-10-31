"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setStaffRole } from "./actions";

type StaffRole = "sales_manager" | "management";

const LABEL: Record<StaffRole, string> = {
  sales_manager: "Sales Manager",
  management: "Management",
};

/**
 * Ops control for the presales tracker's staff roles. Each change asks for a
 * reason (recorded in the audit log) before it is applied.
 */
export function StaffRolesControl({
  memberId,
  roles,
}: {
  memberId: string;
  roles: StaffRole[];
}) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<StaffRole | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const has = (r: StaffRole) => roles.includes(r);

  function apply() {
    if (!pendingRole) return;
    const grant = !has(pendingRole);
    setError(null);
    startTransition(async () => {
      const res = await setStaffRole({
        memberId,
        role: pendingRole,
        grant,
        reason,
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setPendingRole(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {(Object.keys(LABEL) as StaffRole[]).map((r) => (
          <button
            key={r}
            type="button"
            disabled={busy}
            aria-pressed={has(r)}
            onClick={() => {
              setPendingRole(pendingRole === r ? null : r);
              setError(null);
            }}
            className={
              "rounded-lg border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-60 " +
              (has(r)
                ? "border-eten-accent/40 bg-eten-accent-soft text-eten-accent"
                : "border-eten-line bg-eten-panel-hi text-eten-ink-muted hover:text-eten-ink")
            }
          >
            {has(r) ? "✓ " : ""}
            {LABEL[r]}
          </button>
        ))}
      </div>
      {pendingRole && (
        <form
          className="flex w-full max-w-[420px] flex-wrap items-center justify-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <label htmlFor={`staff-role-reason-${memberId}`} className="sr-only">
            Reason
          </label>
          <input
            id={`staff-role-reason-${memberId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Reason to ${has(pendingRole) ? "remove" : "grant"} ${LABEL[pendingRole]}`}
            className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy || reason.trim().length < 3}
            className="bg-eten-accent rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : has(pendingRole) ? (
              "Remove"
            ) : (
              "Grant"
            )}
          </button>
        </form>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
