"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinPod, leavePod } from "./actions";

export type PodCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  isPrimary: boolean;
};

export function PodsDirectory({ pods }: { pods: PodCard[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(pod: PodCard) {
    setError(null);
    setBusyId(pod.id);
    startTransition(async () => {
      const res = pod.isMember
        ? await leavePod({ podId: pod.id })
        : await joinPod({ podId: pod.id });
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pods.map((pod) => {
          const isBusy = pending && busyId === pod.id;
          return (
            <div
              key={pod.id}
              className="glass-card flex flex-col gap-3 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/pods/${pod.slug}`}
                  className="text-on-surface font-display text-body-lg font-bold hover:underline"
                >
                  {pod.name}
                </Link>
                {pod.isPrimary && (
                  <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                    <Star className="size-3.5" />
                    Primary
                  </span>
                )}
              </div>

              {pod.description && (
                <p className="text-on-surface-variant flex-1 text-sm">
                  {pod.description}
                </p>
              )}

              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5 text-xs">
                  <Users className="size-3.5" />
                  {pod.memberCount}{" "}
                  {pod.memberCount === 1 ? "member" : "members"}
                </span>

                {pod.isPrimary ? (
                  <span className="text-on-surface-variant inline-flex items-center gap-1.5 text-xs font-medium">
                    <Check className="size-3.5" />
                    Member
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant={pod.isMember ? "brandOutline" : "brand"}
                    size="pill-sm"
                    disabled={pending}
                    onClick={() => toggle(pod)}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : pod.isMember ? (
                      "Leave"
                    ) : (
                      "Join"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
