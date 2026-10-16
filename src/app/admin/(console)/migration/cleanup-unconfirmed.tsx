"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Preview = { graceDays: number; count: number; sample: string[] };
type Result = { graceDays: number; deleted: number; remaining: number };

const fieldClass =
  "w-24 rounded-lg border border-outline-variant bg-surface p-2 text-sm text-on-surface outline-none transition-all focus:border-primary";
const CONFIRM_PHRASE = "PURGE-UNCONFIRMED";

/**
 * Ops tool to clear never-activated accounts (claimed_at null) that are older
 * than a grace period, excluding @experviatechnologies.com staff and recent
 * sign-ups. Preview first, then confirm to purge.
 */
export function CleanupUnconfirmed() {
  const [graceDays, setGraceDays] = useState("14");
  const [loading, setLoading] = useState<null | "preview" | "purge">(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function run(mode: "preview" | "purge") {
    setLoading(mode);
    setError(null);
    if (mode === "preview") setResult(null);
    try {
      const res = await fetch("/api/admin/purge-unconfirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graceDays: Number(graceDays) || 14,
          mode,
          confirm: mode === "purge" ? CONFIRM_PHRASE : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else if (mode === "preview") {
        setPreview(data as Preview);
      } else {
        setResult(data as Result);
        setPreview(null);
        setConfirmText("");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass-card mt-8 flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <h2 className="text-on-surface flex items-center gap-2 font-semibold">
          <AlertTriangle className="text-destructive size-4" />
          Clean up unconfirmed accounts
        </h2>
        <p className="text-on-surface-variant mt-1 text-sm">
          Permanently removes never-activated accounts (no password set / email
          never confirmed) older than the grace period. Skips staff
          (@experviatechnologies.com) and recent sign-ups. Preview first.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-on-surface-variant text-xs">
            Grace period (days)
          </span>
          <input
            type="number"
            min={0}
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            className={fieldClass}
          />
        </label>
        <Button
          type="button"
          variant="brandOutline"
          size="pill-sm"
          disabled={loading !== null}
          onClick={() => run("preview")}
        >
          {loading === "preview" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Preview
        </Button>
      </div>

      {preview && (
        <div className="border-outline-variant rounded-lg border p-3">
          <p className="text-on-surface text-sm">
            <span className="font-semibold">{preview.count}</span> account
            {preview.count === 1 ? "" : "s"} older than {preview.graceDays} days
            would be removed.
          </p>
          {preview.sample.length > 0 && (
            <ul className="text-on-surface-variant mt-2 max-h-48 space-y-0.5 overflow-y-auto text-xs">
              {preview.sample.map((e) => (
                <li key={e}>{e}</li>
              ))}
              {preview.count > preview.sample.length && (
                <li className="text-on-surface-variant/70">
                  …and {preview.count - preview.sample.length} more
                </li>
              )}
            </ul>
          )}
          {preview.count > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type ${CONFIRM_PHRASE} to confirm`}
                className="border-outline-variant bg-surface text-on-surface focus:border-primary flex-1 rounded-lg border p-2 text-sm outline-none"
              />
              <Button
                type="button"
                variant="destructive"
                size="pill-sm"
                className="shrink-0"
                disabled={loading !== null || confirmText !== CONFIRM_PHRASE}
                onClick={() => run("purge")}
              >
                {loading === "purge" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Purge {preview.count}
              </Button>
            </div>
          )}
        </div>
      )}

      {result && (
        <p className="border-primary/30 bg-primary/10 text-on-surface rounded-lg border p-3 text-sm">
          Removed <span className="font-semibold">{result.deleted}</span>{" "}
          account{result.deleted === 1 ? "" : "s"}.{" "}
          <span className="font-semibold">{result.remaining}</span> still
          unconfirmed (recent / staff).
        </p>
      )}

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
