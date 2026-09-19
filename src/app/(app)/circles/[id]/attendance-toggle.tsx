"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { setAttendance } from "@/app/(app)/circles/actions";

/** Mentor / lead toggle for one mentee's attendance at a session. */
export function AttendanceToggle({
  sessionId,
  memberId,
  attended,
}: {
  sessionId: string;
  memberId: string;
  attended: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await setAttendance({
        sessionId,
        memberId,
        attended: !attended,
      });
      if (!("error" in res)) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={attended}
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 " +
        (attended
          ? "bg-eten-verified-soft text-eten-verified"
          : "bg-eten-panel-hi text-eten-faint hover:text-eten-ink")
      }
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : attended ? (
        <Check className="size-3" />
      ) : (
        <X className="size-3" />
      )}
      {attended ? "Present" : "Absent"}
    </button>
  );
}
