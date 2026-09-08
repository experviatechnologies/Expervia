"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeReportedContent, resolveReport } from "./actions";

export type ReportRow = {
  id: string;
  targetType: "post" | "comment" | "message" | "member";
  targetId: string;
  reason: string;
  reporterName: string;
  createdAt: string;
  snippet: string | null;
  postId: string | null;
  alreadyRemoved: boolean;
};

export function ReportsManager({ reports }: { reports: ReportRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(
    id: string,
    fn: () => Promise<{ ok: true } | { error: string }>,
  ) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <div>
      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {reports.map((r) => {
          const isBusy = pending && busyId === r.id;
          const removable =
            r.targetType === "post" || r.targetType === "comment";
          return (
            <li key={r.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-on-surface flex items-center gap-2 text-sm font-semibold capitalize">
                  {r.targetType}
                  {r.alreadyRemoved && (
                    <span className="border-outline-variant text-on-surface-variant rounded-full border px-2 py-0.5 text-xs font-normal">
                      already removed
                    </span>
                  )}
                </span>
                <span className="text-on-surface-variant text-xs">
                  reported by {r.reporterName}
                </span>
              </div>

              <p className="text-on-surface-variant mt-2 text-sm">
                <span className="text-on-surface-variant/60">Reason: </span>
                {r.reason}
              </p>

              {r.snippet && (
                <blockquote className="border-outline-variant text-on-surface-variant mt-3 border-l-2 pl-3 text-sm italic">
                  {r.snippet.length > 240
                    ? `${r.snippet.slice(0, 240)}…`
                    : r.snippet}
                </blockquote>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {r.postId && (
                  <Link
                    href={`/feed/${r.postId}`}
                    target="_blank"
                    className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <ExternalLink className="size-4" />
                    View in feed
                  </Link>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {isBusy ? (
                    <Loader2 className="text-on-surface-variant size-4 animate-spin" />
                  ) : (
                    <>
                      {removable && !r.alreadyRemoved && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            run(r.id, () =>
                              removeReportedContent({
                                reportId: r.id,
                                targetType: r.targetType,
                                targetId: r.targetId,
                              }),
                            )
                          }
                        >
                          <Trash2 className="size-3.5" />
                          Remove content
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="brandOutline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(r.id, () =>
                            resolveReport({
                              reportId: r.id,
                              status: "dismissed",
                            }),
                          )
                        }
                      >
                        <X className="size-3.5" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
