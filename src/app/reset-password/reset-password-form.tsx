"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none transition-colors";

const labelClass = "text-label-sm text-on-surface-variant";

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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
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

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        variant="brand"
        size="pill-sm"
        disabled={loading}
        className="mt-2 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}
