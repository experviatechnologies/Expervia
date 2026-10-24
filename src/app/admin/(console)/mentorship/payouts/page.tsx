import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  Clock,
  CheckCircle2,
  Landmark,
  Check,
} from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PayoutControl } from "./payout-control";
import { VerifyControl } from "./verify-control";

export const metadata: Metadata = {
  title: "Mentor payouts",
  robots: { index: false, follow: false },
};

const MONEY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};
function money(minor: number, currency: string): string {
  const sym = MONEY_SYMBOLS[currency] ?? `${currency} `;
  return (
    sym + (minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
  );
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

type Balance = { available: number; pending: number; currency: string };

export default async function AdminPayoutsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const now = new Date().getTime();

  // Unpaid earnings drive the balances; paid/reversed are excluded.
  const { data: earningRows } = await admin
    .from("mentor_earnings")
    .select("mentor_id, net_amount, available_at, currency, status")
    .eq("status", "pending");

  const balances = new Map<string, Balance>();
  for (const e of earningRows ?? []) {
    const b = balances.get(e.mentor_id) ?? {
      available: 0,
      pending: 0,
      currency: e.currency,
    };
    if (Date.parse(e.available_at) <= now) b.available += e.net_amount;
    else b.pending += e.net_amount;
    balances.set(e.mentor_id, b);
  }

  const mentorIds = [...balances.keys()];
  const [{ data: profileRows }, { data: accountRows }, { data: payoutRows }] =
    await Promise.all([
      mentorIds.length
        ? admin
            .from("profiles")
            .select("member_id, full_name")
            .in("member_id", mentorIds)
        : Promise.resolve({ data: [] }),
      mentorIds.length
        ? admin
            .from("payout_accounts")
            .select(
              "member_id, bank_name, account_number, account_name, bank_code, currency, verified",
            )
            .in("member_id", mentorIds)
        : Promise.resolve({ data: [] }),
      admin
        .from("mentor_payouts")
        .select(
          "id, mentor_id, amount, currency, status, method, paid_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A mentor"]),
  );
  type Account = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string | null;
    currency: string;
    verified: boolean;
  };
  const accountById = new Map<string, Account>(
    (accountRows ?? []).map((a) => [
      a.member_id,
      {
        bankName: a.bank_name,
        accountNumber: a.account_number,
        accountName: a.account_name,
        bankCode: a.bank_code ?? null,
        currency: a.currency,
        verified: a.verified,
      },
    ]),
  );

  // Mentors needing payout first (highest available), then the rest.
  const rows = mentorIds
    .map((id) => ({ id, ...balances.get(id)! }))
    .sort((a, b) => b.available - a.available);

  const payoutMentorIds = [
    ...new Set((payoutRows ?? []).map((p) => p.mentor_id)),
  ];
  const missingNames = payoutMentorIds.filter((id) => !nameById.has(id));
  if (missingNames.length) {
    const { data: more } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", missingNames);
    for (const p of more ?? [])
      nameById.set(p.member_id, p.full_name ?? "A mentor");
  }

  const cur = rows[0]?.currency ?? payoutRows?.[0]?.currency ?? "NGN";
  const totalAvailable = rows.reduce((s, r) => s + r.available, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);
  const totalPaid = (payoutRows ?? []).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      {/* Heading + back */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[680px]">
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Mentor payouts
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
            Track what each mentor has earned and record payouts.
          </p>
        </div>
        <Link
          href="/admin/mentorship"
          className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to Mentorship
        </Link>
      </header>

      {/* How payouts work */}
      <div className="bg-eten-panel border-eten-line text-eten-ink-muted mb-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl border px-5 py-4 text-[13px]">
        <span className="text-eten-faint font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
          How payouts work
        </span>
        <Step n={1}>
          Session ends, earnings are{" "}
          <b className="text-amber-600 dark:text-amber-400">pending</b>
        </Step>
        <ArrowRight className="text-eten-faint size-3.5" />
        <Step n={2}>
          Settlement hold clears, they become{" "}
          <b className="text-eten-verified">available</b>
        </Step>
        <ArrowRight className="text-eten-faint size-3.5" />
        <Step n={3}>
          Send the bank transfer, then{" "}
          <b className="text-eten-ink">mark paid out</b>
        </Step>
      </div>

      {/* Summary */}
      <div className="mb-6 grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Summary
          Icon={Wallet}
          tone="verified"
          label="Available to pay"
          value={money(totalAvailable, cur)}
        />
        <Summary
          Icon={Clock}
          tone="amber"
          label="Pending settlement"
          value={money(totalPending, cur)}
        />
        <Summary
          Icon={CheckCircle2}
          tone="accent"
          label="Paid out (recent)"
          value={money(totalPaid, cur)}
        />
      </div>

      {/* Mentor balances */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-eten-ink text-[17px] font-bold">
            Mentor balances
          </h2>
          <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2.5 py-0.5 text-[13px] font-bold">
            {rows.length}
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-ink-muted rounded-2xl border p-8 text-center text-sm">
            No mentor has outstanding earnings.
          </div>
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
            {rows.map((r) => {
              const acct = accountById.get(r.id);
              const cantPay = r.available <= 0;
              const hint = cantPay
                ? r.pending > 0
                  ? `${money(r.pending, r.currency)} clears after the settlement hold`
                  : "Nothing to pay out"
                : `Send ${money(r.available, r.currency)} by bank transfer first`;
              return (
                <article
                  key={r.id}
                  className="bg-eten-panel border-eten-line flex flex-col gap-4 rounded-[18px] border p-[22px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-eten-accent-soft text-eten-accent grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold">
                      {initials(nameById.get(r.id) ?? "A mentor")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-eten-ink text-[16px] font-bold">
                        {nameById.get(r.id) ?? "A mentor"}
                      </h3>
                      <div className="text-eten-faint text-xs">Mentor</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-eten-verified-soft rounded-xl p-3.5">
                      <div className="text-eten-verified text-xs font-semibold">
                        Available
                      </div>
                      <div className="text-eten-ink mt-0.5 text-2xl font-extrabold tabular-nums">
                        {money(r.available, r.currency)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-3.5">
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Pending
                      </div>
                      <div className="text-eten-ink mt-0.5 text-2xl font-extrabold tabular-nums">
                        {money(r.pending, r.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="border-eten-line flex flex-wrap items-center gap-3 rounded-[14px] border p-3.5">
                    <span className="bg-eten-panel-hi text-eten-ink-muted grid size-9 shrink-0 place-items-center rounded-[10px]">
                      <Landmark className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    {acct ? (
                      <>
                        <div className="min-w-0 flex-1 basis-[160px]">
                          <div className="text-eten-ink text-sm font-bold">
                            {acct.accountName}
                          </div>
                          <div className="text-eten-ink-muted text-[13px]">
                            <span className="font-mono tabular-nums">
                              {acct.accountNumber}
                            </span>{" "}
                            · {acct.bankName} · {acct.currency}
                          </div>
                        </div>
                        {acct.verified ? (
                          <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-bold">
                            <Check className="size-3" strokeWidth={3} />
                            Verified
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1.5 text-[12px] font-bold text-amber-600 dark:text-amber-400">
                              Unverified
                            </span>
                            <VerifyControl mentorId={r.id} verified={false} />
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                        No payout account set
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-eten-faint text-xs">{hint}</span>
                    <PayoutControl mentorId={r.id} disabled={cantPay} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent payouts */}
      <section className="bg-eten-panel border-eten-line flex min-w-0 flex-col rounded-[18px] border">
        <div className="border-eten-line border-b px-6 py-5">
          <h2 className="text-eten-ink text-[17px] font-bold">
            Recent payouts
          </h2>
        </div>
        {(payoutRows ?? []).length === 0 ? (
          <p className="text-eten-ink-muted p-8 text-center text-sm">
            No payouts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-eten-panel-hi text-left">
                  <Th className="pl-6">Mentor</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th className="pr-6 text-right">Date</Th>
                </tr>
              </thead>
              <tbody>
                {(payoutRows ?? []).map((p) => (
                  <tr
                    key={p.id}
                    className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                  >
                    <td className="py-3.5 pr-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="bg-eten-accent-soft text-eten-accent grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold">
                          {initials(nameById.get(p.mentor_id) ?? "A mentor")}
                        </span>
                        <span className="text-eten-ink font-semibold">
                          {nameById.get(p.mentor_id) ?? "A mentor"}
                        </span>
                      </div>
                    </td>
                    <td className="text-eten-ink px-3 py-3.5 font-extrabold tabular-nums">
                      {money(p.amount, p.currency)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="bg-eten-panel-hi border-eten-line text-eten-ink-muted rounded-[7px] border px-2 py-0.5 text-[12px] font-semibold">
                        {p.method === "manual" || !p.method
                          ? "Manual transfer"
                          : p.method}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize">
                        <span className="bg-eten-verified size-1.5 rounded-full" />
                        {p.status}
                      </span>
                    </td>
                    <td className="text-eten-ink-muted py-3.5 pr-6 pl-3 text-right whitespace-nowrap">
                      {fmtDate(p.paid_at ?? p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span className="bg-eten-accent-soft text-eten-accent grid size-[22px] place-items-center rounded-full text-[12px] font-extrabold">
        {n}
      </span>
      {children}
    </span>
  );
}

function Summary({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "accent" | "verified" | "amber";
  label: string;
  value: string;
}) {
  const square =
    tone === "verified"
      ? "bg-eten-verified-soft text-eten-verified"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-4 rounded-2xl border p-5">
      <span
        className={
          "grid size-12 shrink-0 place-items-center rounded-[14px] " + square
        }
      >
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <div className="text-eten-ink-muted text-[13px] font-semibold">
          {label}
        </div>
        <div className="text-eten-ink truncate text-[26px] font-extrabold tracking-[-0.02em] tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "text-eten-ink-muted border-eten-line border-b px-3 py-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}
