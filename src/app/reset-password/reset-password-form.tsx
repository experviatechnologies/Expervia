"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";

const inputClass = authInputClass;
const labelClass = authLabelClass;

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    // A valid session is required to change the password. It comes from either
    // the recovery link (verified by /auth/confirm) or an existing sign-in.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(
        "Your reset link has expired or was already used. Request a new one and open it from your email.",
      );
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // Surface Supabase's real reason (e.g. "New password should be different
      // from the old password", rate limits, reauthentication) instead of
      // always blaming the link.
      setError(
        updateError.message ||
          "We couldn't update your password. Please try again.",
      );
      setLoading(false);
      return;
    }

    // The recovery session is now a full session — go straight into the app.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          toggleClassName={authPasswordToggleClass}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          toggleClassName={authPasswordToggleClass}
          placeholder="Re-enter your new password"
        />
      </div>

      {error && (
        <p role="alert" className={authErrorClass}>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className={authSubmitClass}>
        {loading ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Updating…
          </>
        ) : (
          <>
            Set new password
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>
    </form>
  );
}
