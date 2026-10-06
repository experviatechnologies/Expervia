import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { settleChargeByReference } from "@/lib/eten/payment-settlement";

export const metadata = { title: "Payment" };

type State = "success" | "pending" | "failed" | "unknown";

/**
 * Where Paystack returns the mentee after checkout (Monetization M-3). We never
 * trust this redirect as proof of payment: we re-verify with Paystack via the
 * shared settlement path (idempotent, so it's fine if the webhook already ran).
 * Paystack appends ?reference= and ?trxref=.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const me = await getCurrentMember();
  if (!me) redirect("/mentorship/signin");

  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref ?? null;

  let state: State = "unknown";
  let circleId: string | null = null;

  if (reference) {
    const admin = getSupabaseAdmin();
    const { data: payment } = await admin
      .from("payments")
      .select("id, payer_id, booking_id")
      .eq("reference", reference)
      .maybeSingle();

    // Only the payer may trigger settlement for their own reference.
    if (payment && payment.payer_id === me.id) {
      try {
        const outcome = await settleChargeByReference(admin, reference);
        state =
          outcome === "settled" || outcome === "already"
            ? "success"
            : outcome === "not_success"
              ? "pending"
              : "failed";
      } catch {
        state = "pending";
      }

      if (payment.booking_id) {
        const { data: after } = await admin
          .from("session_bookings")
          .select("circle_id")
          .eq("id", payment.booking_id)
          .maybeSingle();
        circleId = after?.circle_id ?? null;
      }
    }
  }

  const card =
    "bg-mnt-panel border-mnt-line rounded-2xl border p-6 text-center";
  const btn =
    "bg-mnt-brand text-mnt-on-brand inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110";
  const btnLine =
    "border-mnt-line text-mnt-ink inline-flex items-center justify-center rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition hover:border-mnt-brand";

  return (
    <div className="mx-auto max-w-[520px] px-6 py-12">
      <div className={card}>
        {state === "success" && (
          <>
            <CheckCircle2 className="text-mnt-green mx-auto size-10" />
            <h1 className="font-display mt-3 text-xl font-extrabold">
              Payment confirmed
            </h1>
            <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
              Your session is booked and confirmed. The live room opens 10
              minutes before it starts, join it from your Circle.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {circleId ? (
                <Link href={`/mentorship/circles/${circleId}`} className={btn}>
                  Open your Circle
                </Link>
              ) : (
                <Link href="/mentorship/dashboard" className={btn}>
                  Go to dashboard
                </Link>
              )}
            </div>
          </>
        )}

        {state === "pending" && (
          <>
            <Clock className="text-mnt-amber mx-auto size-10" />
            <h1 className="font-display mt-3 text-xl font-extrabold">
              Confirming your payment
            </h1>
            <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
              We&apos;re still confirming this with the payment provider. It can
              take a moment. You&apos;ll get an email once your session is
              confirmed, no need to pay again.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Link href="/mentorship/dashboard" className={btn}>
                Go to dashboard
              </Link>
            </div>
          </>
        )}

        {(state === "failed" || state === "unknown") && (
          <>
            <XCircle className="text-destructive mx-auto size-10" />
            <h1 className="font-display mt-3 text-xl font-extrabold">
              Payment not confirmed
            </h1>
            <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
              We couldn&apos;t confirm this payment. If you were charged,
              nothing has been scheduled and it will be reconciled; please reach
              out if it isn&apos;t resolved.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Link href="/mentorship/mentors" className={btn}>
                Back to mentors
              </Link>
              <Link href="/mentorship/dashboard" className={btnLine}>
                Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
