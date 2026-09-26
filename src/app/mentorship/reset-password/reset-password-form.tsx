"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";

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
    <form className="mt-6" onSubmit={handleSubmit} noValidate>
      <label
        htmlFor="password"
        className="text-mnt-ink-muted text-[12.5px] font-medium"
      >
        New password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
        placeholder="At least 8 characters"
      />

      <div className="mt-3.5">
        <label
          htmlFor="confirm"
          className="text-mnt-ink-muted text-[12.5px] font-medium"
        >
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="Re-enter your new password"
        />
      </div>

      {error && <p className="text-destructive mt-4 text-[13px]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-mnt-brand text-mnt-on-brand mt-6 w-full rounded-[11px] py-3.5 text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
