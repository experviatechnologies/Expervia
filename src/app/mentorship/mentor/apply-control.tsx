"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyAsMentor } from "./actions";

export function ApplyMentorControl({
  areas,
}: {
  areas: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(areas[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="border-mnt-line bg-mnt-panel text-mnt-ink focus:border-mnt-brand rounded-[10px] border px-3 py-2 text-[13px] outline-none"
      >
        {areas.map((a) => (
          <option key={a.slug} value={a.slug}>
            {a.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !slug}
        className="bg-mnt-amber rounded-[10px] px-4 py-2 text-[13px] font-bold text-[#241a05] disabled:opacity-60"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await applyAsMentor({ capabilityAreaSlug: slug });
            if ("error" in res) setError(res.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Submitting…" : "Apply for verification"}
      </button>
      {error && <p className="text-destructive w-full text-[12px]">{error}</p>}
    </div>
  );
}
