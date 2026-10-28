import { redirect } from "next/navigation";
import { Landmark, Clock, CircleCheck } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { summarizeEarnings } from "@/lib/eten/earnings";
import { PayoutAccountForm, type PayoutAccount } from "./payout-account-form";
import { EarningsHistory } from "./earnings-history";

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
        <h1 className="font-display text-mnt-ink text-2xl font-extrabold">
          Earnings
        </h1>
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
  const nowMs = new Date().getTime();
  const summary = summarizeEarnings(earnings, nowMs);
  const cur = summary.currency;

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

  const tiles = [
    {
      label: "Available",
      value: summary.availableMinor,
      hint: "Ready for the next payout",
      Icon: Landmark,
      wrap: "bg-mnt-green/10",
      fg: "text-mnt-green",
    },
    {
      label: "Pending",
      value: summary.pendingMinor,
      hint: "Clearing the settlement hold",
      Icon: Clock,
      wrap: "bg-amber-500/10",
      fg: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Paid out",
      value: summary.paidMinor,
      hint: "Sent to your bank",
      Icon: CircleCheck,
      wrap: "bg-mnt-brand/10",
      fg: "text-mnt-brand",
    },
  ];

  const historyEarnings = earnings.map((e) => ({
    id: e.id,
    amountMinor: e.net_amount,
    currency: e.currency,
    status: e.status,
    availableAtMs: Date.parse(e.available_at),
    dateIso: e.created_at,
  }));
  const historyPayouts = (payoutRows ?? []).map((p) => ({
    id: p.id,
    amountMinor: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method ?? "transfer",
    dateIso: p.paid_at ?? p.created_at,
  }));

  return (
    <div className="px-6 py-9 md:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <header className="max-w-[680px]">
          <h1 className="font-display text-mnt-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Earnings
          </h1>
          <p className="text-mnt-ink-muted mt-1.5 text-[15px] leading-relaxed">
            What you&apos;ve earned from paid sessions and extensions. Earnings
            clear a short hold after each session, then become available for
            payout.
          </p>
        </header>

        {/* Balance overview */}
        <section className="bg-mnt-panel border-mnt-line flex flex-col gap-5 rounded-[18px] border p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-mnt-ink-muted text-[13px] font-semibold">
                Total earned
              </div>
              <div className="text-mnt-ink text-[40px] font-extrabold tracking-[-0.02em] tabular-nums">
                {money(summary.totalEarnedMinor, cur)}
              </div>
            </div>
            <div className="text-mnt-ink-muted flex flex-wrap gap-3 text-[13px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="bg-mnt-brand size-2.5 rounded" /> Paid out
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-mnt-green size-2.5 rounded" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-amber-500" /> Pending
              </span>
            </div>
          </div>

          {/* Stacked bar */}
          {summary.totalEarnedMinor > 0 ? (
            <div
              className="flex h-3.5 gap-1"
              role="img"
              aria-label={`Of ${money(summary.totalEarnedMinor, cur)} earned, ${money(summary.paidMinor, cur)} paid out, ${money(summary.availableMinor, cur)} available, ${money(summary.pendingMinor, cur)} pending`}
            >
              {summary.paidMinor > 0 && (
                <div
                  className="bg-mnt-brand rounded-full"
                  style={{ flexGrow: summary.paidMinor }}
                />
              )}
              {summary.availableMinor > 0 && (
                <div
                  className="bg-mnt-green rounded-full"
                  style={{ flexGrow: summary.availableMinor }}
                />
              )}
              {summary.pendingMinor > 0 && (
                <div
                  className="rounded-full bg-amber-500"
                  style={{ flexGrow: summary.pendingMinor }}
                />
              )}
            </div>
          ) : (
            <div className="bg-mnt-panel-2 h-3.5 rounded-full" />
          )}

          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="bg-mnt-panel-2 rounded-2xl p-4">
                <div
                  className={`flex items-center gap-2 text-[13px] font-semibold ${t.fg}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-lg ${t.wrap}`}
                  >
                    <t.Icon className="size-4" strokeWidth={2} />
                  </span>
                  {t.label}
                </div>
                <div className="text-mnt-ink mt-1 text-[26px] font-extrabold tabular-nums">
                  {money(t.value, cur)}
                </div>
                <div className="text-mnt-ink-muted text-[12px]">{t.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-start gap-5">
          <EarningsHistory
            earnings={historyEarnings}
            payouts={historyPayouts}
            nowMs={nowMs}
          />
          <PayoutAccountForm account={account} />
        </div>
      </div>
    </div>
  );
}
