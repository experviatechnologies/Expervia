"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none transition-colors";

type Setup = { factorId: string; qr: string; secret: string };

/**
 * Authenticator app (TOTP) set-up and code entry, using Supabase Auth MFA.
 * A correct code upgrades the session to aal2; the server checks that on
 * every staff page and action, so this form is only the way in.
 */
export function MfaForm({
  mode,
  next,
}: {
  mode: "enroll" | "verify";
  next: string;
}) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Enrolling twice (e.g. React's dev double-run) would leave a stray factor.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) {
        setError("Couldn't load your sign-in settings. Refresh to try again.");
        setLoading(false);
        return;
      }

      if (mode === "verify") {
        const factor = factors.totp[0];
        if (!factor) {
          // Reset by an admin since this page loaded: set up again instead.
          window.location.reload();
          return;
        }
        setFactorId(factor.id);
        setLoading(false);
        return;
      }

      // Clear any half-finished set-up from an earlier visit, then start fresh.
      for (const f of factors.all) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "ETEN",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).slice(2, 6)}`,
      });
      if (enrollError || !data) {
        setError("Couldn't start the set-up. Refresh to try again.");
        setLoading(false);
        return;
      }
      setFactorId(data.id);
      setSetup({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setLoading(false);
    })();
  }, [mode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId) return;
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6-digit code from your app.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: clean,
    });
    if (verifyError) {
      setError(
        "That code didn't work. Codes change every 30 seconds, so try the newest one. If it keeps failing, check the time on your phone is set automatically.",
      );
      setCode("");
      setSubmitting(false);
      return;
    }

    // The session is now aal2. A full load makes every server check see it.
    window.location.assign(next);
  }

  if (loading) {
    return (
      <div className="text-on-surface-variant flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {setup && (
        <ol className="text-on-surface-variant flex flex-col gap-4 text-sm">
          <li>
            <span className="text-on-surface font-semibold">1.</span> Install an
            authenticator app on your phone, such as Google Authenticator,
            Microsoft Authenticator or 1Password.
          </li>
          <li>
            <span className="text-on-surface font-semibold">2.</span> In the
            app, add an account and scan this code.
            <div className="mt-3 flex justify-center">
              {/* The QR code is an SVG data URL from Supabase, not a remote image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qr}
                alt="QR code to add ETEN to your authenticator app"
                width={176}
                height={176}
                className="rounded-lg bg-white p-2"
              />
            </div>
            <div className="mt-2 text-center">
              {showSecret ? (
                <p className="text-on-surface font-mono text-xs break-all select-all">
                  {setup.secret}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSecret(true)}
                  className="text-primary text-xs hover:underline"
                >
                  Can&apos;t scan? Show a setup key to type in instead
                </button>
              )}
            </div>
          </li>
          <li>
            <span className="text-on-surface font-semibold">3.</span> Enter the
            6-digit code the app shows for ETEN.
          </li>
        </ol>
      )}

      {factorId && (
        <div className="flex flex-col gap-2">
          <label htmlFor="mfa-code" className="sr-only">
            6-digit code
          </label>
          <input
            id="mfa-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={!setup}
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
            className={inputClass}
            placeholder="000000"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {factorId && (
        <Button
          type="submit"
          variant="brand"
          size="pill-sm"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Checking…
            </>
          ) : setup ? (
            "Turn on two-step sign-in"
          ) : (
            "Continue"
          )}
        </Button>
      )}
    </form>
  );
}
