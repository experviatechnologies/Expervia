"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/shared/password-input";
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPasswordToggleClass,
  authSubmitClass,
} from "@/components/site/auth-shell";

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

    // A valid session is required to change the password. It comes from the
    // recovery link (verified by /auth/confirm) or an existing sign-in.
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
      setError(
        updateError.message ||
          "We couldn't update your password. Please try again.",
      );
      setLoading(false);
      return;
    }

    // The recovery session is now a full session — go into the dashboard, which
    // routes mentors to their own view.
    router.push("/mentorship/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-7" onSubmit={handleSubmit} noValidate>
      <label htmlFor="password" className={authLabelClass}>
        New password
      </label>
      <PasswordInput
        id="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${authInputClass} pr-12`}
        wrapperClassName="mt-2"
        toggleClassName={authPasswordToggleClass}
        placeholder="At least 8 characters"
      />

      <div className="mt-5">
        <label htmlFor="confirm" className={authLabelClass}>
          Confirm new password
        </label>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`${authInputClass} pr-12`}
          wrapperClassName="mt-2"
          toggleClassName={authPasswordToggleClass}
          placeholder="Re-enter your new password"
        />
      </div>

      {error && (
        <p role="alert" className={`${authErrorClass} mt-5`}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${authSubmitClass} mt-6`}
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
