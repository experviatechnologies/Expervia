import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SettingsForm, type MonetizationConfig } from "./settings-form";
import { RefundControl } from "./refund-control";

export const metadata: Metadata = {
  title: "Mentorship revenue",
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

const CHARGED = ["success", "partially_refunded", "refunded"];

export default async function AdminRevenuePage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const now = new Date().getTime();

  const [
    { data: settings },
    { data: paymentRows },
    { data: refundRows },
    { data: earningRows },
    { data: payoutRows },
  ] = await Promise.all([
    admin
      .from("mentorship_settings")
      .select(
        "platform_commission_percent, settlement_hold_hours, refund_full_hours, refund_partial_hours, refund_partial_percent",
      )
      .eq("id", true)
      .maybeSingle(),
    admin
      .from("payments")
      .select(
        "id, payer_id, mentor_id, amount, platform_fee, payment_fee, purpose, currency, status, created_at",
      )
      .order("created_at", { ascending: false }),
    admin.from("refunds").select("amount").eq("status", "processed"),
    admin.from("mentor_earnings").select("net_amount, status, available_at"),
    admin.from("mentor_payouts").select("amount, status"),
  ]);

  const payments = paymentRows ?? [];
  const charged = payments.filter((p) => CHARGED.includes(p.status));
  const currency = charged[0]?.currency ?? payments[0]?.currency ?? "NGN";
  const sum = <T,>(arr: T[], f: (x: T) => number) =>
    arr.reduce((s, x) => s + f(x), 0);

  const gross = sum(charged, (p) => p.amount);
  const refunded = sum(refundRows ?? [], (r) => r.amount);
  const commission = sum(charged, (p) => p.platform_fee);
  const paymentFees = sum(charged, (p) => p.payment_fee ?? 0);
  const mentorEarnings = sum(
    (earningRows ?? []).filter((e) => e.status !== "reversed"),
    (e) => e.net_amount,
  );
  const paidOut = sum(
    (payoutRows ?? []).filter((p) => p.status === "paid"),
    (p) => p.amount,
  );
  const available = sum(
    (earningRows ?? []).filter(
      (e) => e.status === "pending" && Date.parse(e.available_at) <= now,
    ),
    (e) => e.net_amount,
  );
  const pendingHold = sum(
    (earningRows ?? []).filter(
      (e) => e.status === "pending" && Date.parse(e.available_at) > now,
    ),
    (e) => e.net_amount,
  );

  const sessionPayments = charged.filter((p) => p.purpose === "session");
  const extensionPayments = charged.filter((p) => p.purpose === "extension");
  const paidMentors = new Set(charged.map((p) => p.mentor_id)).size;
  const avgSession = sessionPayments.length
    ? Math.round(sum(sessionPayments, (p) => p.amount) / sessionPayments.length)
    : 0;

  // Names for the recent-payments table.
  const recent = payments.slice(0, 30);
  const ids = [...new Set(recent.flatMap((p) => [p.payer_id, p.mentor_id]))];
  const { data: profileRows } = ids.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", ids)
    : { data: [] };
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );

  const config: MonetizationConfig = {
    commissionPercent: Number(settings?.platform_commission_percent ?? 20),
    settlementHoldHours: Number(settings?.settlement_hold_hours ?? 24),
    refundFullHours: Number(settings?.refund_full_hours ?? 24),
    refundPartialHours: Number(settings?.refund_partial_hours ?? 12),
    refundPartialPercent: Number(settings?.refund_partial_percent ?? 50),
  };

  const kpis: { label: string; value: string; tone?: string }[] = [
    { label: "Gross collected", value: money(gross, currency) },
    {
      label: "Refunds",
      value: money(refunded, currency),
      tone: "text-destructive",
    },
    { label: "Net collected", value: money(gross - refunded, currency) },
    {
      label: "ETEN commission",
      value: money(commission, currency),
      tone: "text-eten-accent",
    },
    { label: "Mentor earnings", value: money(mentorEarnings, currency) },
    { label: "Payment fees", value: money(paymentFees, currency) },
    { label: "Paid out", value: money(paidOut, currency) },
    {
      label: "Available (unpaid)",
      value: money(available, currency),
      tone: "text-eten-verified",
    },
    {
      label: "In settlement hold",
      value: money(pendingHold, currency),
      tone: "text-amber-400",
    },
    { label: "Paid sessions", value: String(sessionPayments.length) },
    { label: "Extensions", value: String(extensionPayments.length) },
    { label: "Active paid mentors", value: String(paidMentors) },
    { label: "Avg session value", value: money(avgSession, currency) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Mentorship revenue
          </h1>
          <p className="text-eten-ink-muted mt-1 text-sm">
            Commission and policy config, revenue overview, and payment
            reconciliation.
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
          Monetization settings
        </h2>
        <p className="text-eten-ink-muted mt-1 mb-4 text-xs">
          Applied to new transactions. Existing payments keep the values they
          were charged with.
        </p>
        <SettingsForm initial={config} />
      </section>

      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="border-eten-line bg-eten-panel rounded-2xl border p-4"
            >
              <div className="text-eten-ink-muted text-xs">{k.label}</div>
              <div
                className={`font-display mt-1.5 text-lg font-extrabold tabular-nums ${k.tone ?? "text-eten-ink"}`}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-eten-line bg-eten-panel rounded-2xl border p-5">
        <h2 className="text-eten-ink text-sm font-bold">Recent payments</h2>
        {recent.length === 0 ? (
          <p className="text-eten-ink-muted mt-2 text-sm">No payments yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-eten-ink-muted border-eten-line border-b text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Mentee</th>
                  <th className="py-2 pr-4 font-medium">Mentor</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-0 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const refundable =
                    p.status === "success" || p.status === "partially_refunded";
                  return (
                    <tr key={p.id} className="border-eten-line/60 border-b">
                      <td className="py-2.5 pr-4">
                        {nameById.get(p.payer_id) ?? "A mentee"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {nameById.get(p.mentor_id) ?? "A mentor"}
                      </td>
                      <td className="text-eten-ink-muted py-2.5 pr-4 capitalize">
                        {p.purpose}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {money(p.amount, p.currency)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            p.status === "success"
                              ? "text-eten-verified"
                              : p.status === "pending" ||
                                  p.status === "processing"
                                ? "text-amber-400"
                                : p.status === "refunded" ||
                                    p.status === "partially_refunded"
                                  ? "text-eten-ink-muted"
                                  : "text-destructive"
                          }
                        >
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-eten-ink-muted py-2.5 pr-4">
                        {fmtDate(p.created_at)}
                      </td>
                      <td className="py-2.5 pr-0 text-right">
                        {refundable && <RefundControl paymentId={p.id} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
