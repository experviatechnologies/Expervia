"use client";

import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

/**
 * Downloads a CSV that was built on the server (passed in as `csv`). Use when
 * the page already assembled the rows server-side; for client-loaded tables use
 * toCsv/downloadCsv directly.
 */
export function DownloadCsvButton({
  csv,
  filename,
  label = "Export CSV",
  className,
}: {
  csv: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, csv)}
      className={
        className ??
        "border-border text-foreground hover:bg-accent inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors"
      }
    >
      <Download className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}
