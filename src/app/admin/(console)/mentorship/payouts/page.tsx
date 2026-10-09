import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Mentor payouts
          </h1>
          <p className="text-eten-ink-muted mt-1 text-sm">
            Available balances clear the settlement hold after each session. Pay
            out records the payout and marks those earnings paid; send the bank
            transfer out-of-band.
          </p>
        </div>
        <Link
          href="/admin/mentorship"
          className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          ← Mentorship
        </Link>
      </header>

      <section className="border-eten-line bg-eten-panel mb-8 rounded-2xl border p-5">
        <h2 className="text-eten-ink text-sm font-bold">
          Mentor balances · {rows.length}
        </h2>
        {rows.length === 0 ? (
          <p className="text-eten-ink-muted mt-2 text-sm">
            No mentor has outstanding earnings.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-eten-ink-muted border-eten-line border-b text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Mentor</th>
                  <th className="py-2 pr-4 font-medium">Available</th>
                  <th className="py-2 pr-4 font-medium">Pending</th>
                  <th className="py-2 pr-4 font-medium">Payout account</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const acct = accountById.get(r.id);
                  return (
                    <tr
                      key={r.id}
                      className="border-eten-line/60 border-b align-top"
                    >
                      <td className="py-3 pr-4 font-semibold">
                        {nameById.get(r.id) ?? "A mentor"}
                      </td>
                      <td className="text-eten-verified py-3 pr-4 font-semibold tabular-nums">
                        {money(r.available, r.currency)}
                      </td>
                      <td className="text-eten-ink-muted py-3 pr-4 tabular-nums">
                        {money(r.pending, r.currency)}
                      </td>
                      <td className="py-3 pr-4">
                        {!acct ? (
                          <span className="text-amber-400">Not set</span>
                        ) : (
                          <div className="min-w-[180px]">
                            <div className="text-eten-ink font-medium">
                              {acct.accountName}
                            </div>
                            <div className="text-eten-ink font-mono tabular-nums">
                              {acct.accountNumber}
                            </div>
                            <div className="text-eten-ink-muted text-xs">
                              {acct.bankName}
                              {acct.bankCode
                                ? ` · ${acct.bankCode}`
                                : ""} · {acct.currency}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span
                                className={
                                  "font-mono text-[10.5px] tracking-wide uppercase " +
                                  (acct.verified
                                    ? "text-eten-verified"
                                    : "text-amber-400")
                                }
                              >
                                {acct.verified ? "Verified" : "Unverified"}
                              </span>
                              <VerifyControl
                                mentorId={r.id}
                                verified={acct.verified}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-0 text-right">
                        <PayoutControl
                          mentorId={r.id}
                          disabled={r.available <= 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-eten-line bg-eten-panel rounded-2xl border p-5">
        <h2 className="text-eten-ink text-sm font-bold">Recent payouts</h2>
        {(payoutRows ?? []).length === 0 ? (
          <p className="text-eten-ink-muted mt-2 text-sm">No payouts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-eten-ink-muted border-eten-line border-b text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Mentor</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(payoutRows ?? []).map((p) => (
                  <tr key={p.id} className="border-eten-line/60 border-b">
                    <td className="py-2.5 pr-4 font-semibold">
                      {nameById.get(p.mentor_id) ?? "A mentor"}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {money(p.amount, p.currency)}
                    </td>
                    <td className="text-eten-ink-muted py-2.5 pr-4">
                      {p.method}
                    </td>
                    <td className="text-eten-verified py-2.5 pr-4">
                      {p.status}
                    </td>
                    <td className="text-eten-ink-muted py-2.5 pr-4">
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
