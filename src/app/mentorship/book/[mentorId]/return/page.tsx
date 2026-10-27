import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { settleChargeByReference } from "@/lib/eten/payment-settlement";
import { sendGuestBookingWelcome } from "@/lib/eten/guest-booking-email";
import { requestOrigin } from "@/lib/eten/request-origin";

export const metadata = { title: "Booking" };

type State = "success" | "pending" | "failed" | "unknown";

/**
 * Public return URL for a guest booking (no sign-in). Paystack appends
 * ?reference / ?trxref. We never trust the redirect as proof of payment: we
 * re-verify with Paystack through the shared, idempotent settlement path (the
 * same one the webhook runs), which also confirms the booking into a session.
 */
export default async function GuestBookingReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ mentorId: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { mentorId } = await params;
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref ?? null;

  let state: State = "unknown";

  if (reference) {
    const admin = getSupabaseAdmin();
    const { data: payment } = await admin
      .from("payments")
      .select("id, purpose, booking_id")
      .eq("reference", reference)
      .maybeSingle();

    if (payment) {
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

      // Payment settled and the booking is confirmed: send the guest their
      // confirmation + account link once (the helper dedupes and never throws).
      if (state === "success" && payment.booking_id) {
        const origin = await requestOrigin();
        await sendGuestBookingWelcome(origin, payment.booking_id);
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
    <div className="bg-mnt-bg min-h-screen">
      <div className="mx-auto max-w-[520px] px-6 py-16">
        <div className={card}>
          {state === "success" && (
            <>
              <CheckCircle2 className="text-mnt-green mx-auto size-10" />
              <h1 className="font-display text-mnt-ink mt-3 text-xl font-extrabold">
                You&apos;re booked
              </h1>
              <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
                Your session is confirmed. We&apos;ve emailed your confirmation
                and the video link, plus a link to set up your ETEN account so
                you can join and manage the session. You&apos;ll get a reminder
                an hour before.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Link href="/mentorship/signin" className={btn}>
                  Sign in to your account
                </Link>
                <Link href={`/mentorship/book/${mentorId}`} className={btnLine}>
                  Book another
                </Link>
              </div>
            </>
          )}

          {state === "pending" && (
            <>
              <Clock className="text-mnt-amber mx-auto size-10" />
              <h1 className="font-display text-mnt-ink mt-3 text-xl font-extrabold">
                Confirming your payment
              </h1>
              <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
                We&apos;re still confirming this with the payment provider. It
                can take a moment. You&apos;ll get an email once your session is
                confirmed, no need to pay again.
              </p>
            </>
          )}

          {(state === "failed" || state === "unknown") && (
            <>
              <XCircle className="text-destructive mx-auto size-10" />
              <h1 className="font-display text-mnt-ink mt-3 text-xl font-extrabold">
                Payment not confirmed
              </h1>
              <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
                We couldn&apos;t confirm this payment. If you were charged,
                nothing has been scheduled and it will be reconciled. Please try
                again or reach out if it isn&apos;t resolved.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Link href={`/mentorship/book/${mentorId}`} className={btn}>
                  Try again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
