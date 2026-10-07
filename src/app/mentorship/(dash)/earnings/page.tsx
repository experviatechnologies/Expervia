import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { summarizeEarnings } from "@/lib/eten/earnings";
import { PayoutAccountForm, type PayoutAccount } from "./payout-account-form";

export const metadata = { title: "Earnings" };

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

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

export default async function MentorEarningsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", member.id)
    .maybeSingle();
  const isVerifiedMentor = Boolean(mp && mp.mentor_status !== "candidate");

  if (!isVerifiedMentor) {
    return (
      <div className="mx-auto max-w-[820px] px-6 py-8">
        <h1 className="font-display text-2xl font-extrabold">Earnings</h1>
        <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
          Only verified mentors have earnings. Once you&apos;re verified and
          taking paid sessions, your balance, payout account and history appear
          here.
        </p>
      </div>
    );
  }

  const [{ data: earningRows }, { data: accountRow }, { data: payoutRows }] =
    await Promise.all([
      admin
        .from("mentor_earnings")
        .select(
          "id, net_amount, status, available_at, currency, created_at, session_id",
        )
        .eq("mentor_id", member.id)
        .order("created_at", { ascending: false }),
      admin
        .from("payout_accounts")
        .select(
          "bank_name, account_number, account_name, bank_code, currency, verified",
        )
        .eq("member_id", member.id)
        .maybeSingle(),
      admin
        .from("mentor_payouts")
        .select("id, amount, currency, status, method, created_at, paid_at")
        .eq("mentor_id", member.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const earnings = earningRows ?? [];
  const now = new Date().getTime();
  const summary = summarizeEarnings(earnings, now);

  const account: PayoutAccount = accountRow
    ? {
        bankName: accountRow.bank_name,
        accountNumber: accountRow.account_number,
        accountName: accountRow.account_name,
        bankCode: accountRow.bank_code ?? "",
        currency: accountRow.currency,
        verified: accountRow.verified,
      }
    : null;

  const cur = summary.currency;
  const stats = [
    {
      label: "Available",
      value: summary.availableMinor,
      tone: "text-mnt-green",
    },
    { label: "Pending", value: summary.pendingMinor, tone: "text-mnt-amber" },
    { label: "Paid out", value: summary.paidMinor, tone: "text-mnt-ink" },
    {
      label: "Total earned",
      value: summary.totalEarnedMinor,
      tone: "text-mnt-brand",
    },
  ];

  return (
    <div className="mx-auto max-w-[820px] px-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Earnings</h1>
        <p className="text-mnt-ink-muted mt-1 text-[14px] leading-relaxed">
          Your earnings from paid sessions and extensions. Earnings clear a
          short hold after each session, then become available for payout.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-mnt-panel border-mnt-line rounded-2xl border p-4"
          >
            <div className={lbl}>{s.label}</div>
            <div
              className={`font-display mt-1.5 text-[20px] font-extrabold tabular-nums ${s.tone}`}
            >
              {money(s.value, cur)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <PayoutAccountForm account={account} />
      </div>

      {/* Earnings history */}
      <div className="bg-mnt-panel border-mnt-line mt-6 rounded-2xl border p-5">
        <div className="text-mnt-ink text-[14px] font-bold">
          Earnings history
        </div>
        {earnings.length === 0 ? (
          <p className="text-mnt-faint mt-3 text-[13px]">
            No earnings yet. Paid sessions and extensions will show here.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {earnings.map((e) => {
              const state =
                e.status === "paid"
                  ? { text: "Paid out", cls: "text-mnt-ink-muted" }
                  : e.status === "reversed"
                    ? { text: "Reversed", cls: "text-destructive" }
                    : Date.parse(e.available_at) <= now
                      ? { text: "Available", cls: "text-mnt-green" }
                      : { text: "Pending", cls: "text-mnt-amber" };
              return (
                <div
                  key={e.id}
                  className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                >
                  <span className="text-[13.5px]">
                    <span className="font-semibold tabular-nums">
                      {money(e.net_amount, e.currency)}
                    </span>
                    <span className="text-mnt-faint">
                      {" "}
                      · {fmtDate(e.created_at)}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-[11px] tracking-wide uppercase ${state.cls}`}
                  >
                    {state.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-mnt-panel border-mnt-line mt-6 rounded-2xl border p-5">
        <div className="text-mnt-ink text-[14px] font-bold">Payout history</div>
        {(payoutRows ?? []).length === 0 ? (
          <p className="text-mnt-faint mt-3 text-[13px]">No payouts yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {(payoutRows ?? []).map((p) => (
              <div
                key={p.id}
                className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
              >
                <span className="text-[13.5px]">
                  <span className="font-semibold tabular-nums">
                    {money(p.amount, p.currency)}
                  </span>
                  <span className="text-mnt-faint">
                    {" "}
                    · {fmtDate(p.paid_at ?? p.created_at)} · {p.method}
                  </span>
                </span>
                <span className="text-mnt-green font-mono text-[11px] tracking-wide uppercase">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
