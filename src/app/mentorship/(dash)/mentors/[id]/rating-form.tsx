"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Check } from "lucide-react";
import { rateMentor } from "../rating-actions";

export function RatingForm({
  mentorId,
  initialRating,
  initialReview,
}: {
  mentorId: string;
  initialRating: number | null;
  initialReview: string | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(initialReview ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = hover || rating;

  function submit() {
    if (rating < 1) {
      setError("Pick a star rating first.");
      return;
    }
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await rateMentor({ mentorId, rating, review });
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
      <div className="text-mnt-ink text-[14px] font-bold">
        {initialRating ? "Your rating" : "Rate this mentor"}
      </div>
      <p className="text-mnt-ink-muted mt-1 text-[13px]">
        Share how your sessions went. You can update this anytime.
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition"
          >
            <Star
              className={
                "size-7 " +
                (n <= shown
                  ? "fill-mnt-amber text-mnt-amber"
                  : "text-mnt-faint")
              }
            />
          </button>
        ))}
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Optional: a few words about your experience"
        className="border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-3 w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none"
      />

      {error && <p className="text-destructive mt-2 text-[12.5px]">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : initialRating
              ? "Update rating"
              : "Submit rating"}
        </button>
        {saved && (
          <span className="text-mnt-green inline-flex items-center gap-1 text-[12.5px]">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
