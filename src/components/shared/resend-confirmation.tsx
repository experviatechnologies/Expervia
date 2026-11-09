"use client";

import { useEffect, useState } from "react";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";

/**
 * "Didn't get it?" help under every confirmation screen (9 Nov 2026): where
 * Gmail tends to put the email, and a resend button with a cool-down. The
 * server answers the same whether or not the address has an account.
 */
export function ResendConfirmation({
  email,
  className = "",
  buttonClassName = "text-primary font-semibold hover:underline disabled:opacity-60 disabled:no-underline",
  showTips = true,
}: {
  email: string;
  className?: string;
  buttonClassName?: string;
  showTips?: boolean;
}) {
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, [HONEYPOT_FIELD]: "" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(json?.error ?? "Couldn't send it. Please try again shortly.");
      } else {
        setMsg("Sent. It can take a few minutes to arrive.");
        setWait(60);
      }
    } catch {
      setMsg("Couldn't send it. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`text-sm ${className}`}>
      {showTips && (
        <div className="text-left">
          <p className="font-medium">Can&apos;t find it?</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 opacity-80">
            <li>
              Check <b>Spam</b> and, in Gmail, the <b>Promotions</b> and{" "}
              <b>Updates</b> tabs.
            </li>
            <li>
              Search your mail for <b>&quot;Expervia&quot;</b>.
            </li>
            <li>
              If it&apos;s in Spam, mark it <b>Not spam</b> so the next one
              arrives in your inbox.
            </li>
          </ul>
        </div>
      )}
      <p className="mt-3">
        <button
          type="button"
          onClick={resend}
          disabled={busy || wait > 0}
          className={buttonClassName}
        >
          {busy
            ? "Sending…"
            : wait > 0
              ? `Resend available in ${wait}s`
              : "Resend the confirmation email"}
        </button>
      </p>
      {msg && (
        <p role="status" className="mt-1 opacity-80">
          {msg}
        </p>
      )}
    </div>
  );
}
