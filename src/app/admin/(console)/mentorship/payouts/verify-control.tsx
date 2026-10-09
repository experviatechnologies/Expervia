"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPayoutAccountVerified } from "./actions";

/** Toggle a mentor's payout-account verified flag (ops confirms the details). */
export function VerifyControl({
  mentorId,
  verified,
}: {
  mentorId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await setPayoutAccountVerified({
        mentorId,
        verified: !verified,
      });
      if (!("error" in res)) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 " +
        (verified
          ? "border-eten-line text-eten-ink-muted hover:text-eten-ink"
          : "border-eten-verified/50 text-eten-verified hover:bg-eten-verified/10")
      }
    >
      {pending ? "…" : verified ? "Unverify" : "Mark verified"}
    </button>
  );
}
