"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2, RotateCcw, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setMemberStatus } from "./actions";

export type MemberRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  status: "active" | "suspended" | "deactivated";
  role: "member" | "operations";
  origin: "self_signup" | "migrated";
  claimedAt: string | null;
  createdAt: string;
};

function StatusBadge({ status }: { status: MemberRow["status"] }) {
  const map = {
    active: "border-primary/30 bg-primary/10 text-primary",
    suspended: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    deactivated: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function MembersManager({ members }: { members: MemberRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(memberId: string, status: MemberRow["status"]) {
    setError(null);
    setBusyId(memberId);
    startTransition(async () => {
      const res = await setMemberStatus({ memberId, status });
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <div>
      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <Th>Member</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th>Origin</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isBusy = pending && busyId === m.id;
              const isOps = m.role === "operations";
              return (
                <tr
                  key={m.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="text-on-surface font-medium">
                      {m.fullName ?? "—"}
                    </div>
                    {m.email && (
                      <div className="text-on-surface-variant text-xs">
                        {m.email}
                      </div>
                    )}
                    {!m.claimedAt && (
                      <div className="text-on-surface-variant/60 mt-0.5 text-xs italic">
                        not yet activated
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="text-on-surface-variant capitalize">
                      {m.role}
                    </span>
                  </td>
                  <td className="text-on-surface-variant px-4 py-4 align-top">
                    {m.origin === "self_signup" ? "Self sign-up" : "Migrated"}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {isOps ? (
                      <span className="text-on-surface-variant/50 text-xs">
                        Protected
                      </span>
                    ) : isBusy ? (
                      <Loader2 className="text-on-surface-variant size-4 animate-spin" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {m.status !== "active" && (
                          <ActionButton
                            onClick={() => act(m.id, "active")}
                            disabled={pending}
                            Icon={RotateCcw}
                          >
                            Reactivate
                          </ActionButton>
                        )}
                        {m.status === "active" && (
                          <ActionButton
                            onClick={() => act(m.id, "suspended")}
                            disabled={pending}
                            Icon={Ban}
                          >
                            Suspend
                          </ActionButton>
                        )}
                        {m.status !== "deactivated" && (
                          <ActionButton
                            onClick={() => act(m.id, "deactivated")}
                            disabled={pending}
                            Icon={UserX}
                            danger
                          >
                            Deactivate
                          </ActionButton>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  Icon,
  danger,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  Icon: typeof Ban;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={danger ? "destructive" : "brandOutline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
      {children}
    </Button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-label-sm text-on-surface-variant px-4 py-3 font-mono font-normal tracking-wider uppercase">
      {children}
    </th>
  );
}
