"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";

/**
 * Exports data to a CSV file the browser downloads. The CSV itself is built
 * server-side by `action` (so it can cover ALL matching rows, not just the page
 * on screen), passed its serializable `args`. Styled with neutral shadcn tokens
 * by default so it fits any [data-app-surface] shell; pass `className` to match
 * a surface's buttons.
 */
export function ExportCsvButton<A>({
  action,
  args,
  filename,
  label = "Export CSV",
  className,
}: {
  action: (args: A) => Promise<{ csv: string } | { error: string }>;
  args: A;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    start(async () => {
      const res = await action(args);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      try {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("Couldn't start the download.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      title={error ?? undefined}
      className={
        className ??
        "border-border text-foreground hover:bg-accent inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-60"
      }
    >
      <Download className="size-4" strokeWidth={1.8} />
      {pending ? "Exporting…" : error ? "Try again" : label}
    </button>
  );
}
