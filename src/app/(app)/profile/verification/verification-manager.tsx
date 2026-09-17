"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, FileText, Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VerificationRow = {
  kind: "identity" | "address";
  status: "unverified" | "verified" | "rejected";
  documentType: "passport" | "drivers_license" | "nin" | null;
  filePath: string;
  reviewNote: string | null;
};

const ID_TYPE_LABEL: Record<string, string> = {
  passport: "International Passport",
  drivers_license: "Driver's License",
  nin: "National ID (NIN)",
};

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-3 text-sm text-eten-ink outline-none transition-all focus:border-eten-accent";
const labelClass = "text-label-sm text-eten-ink-muted font-mono uppercase";

export function VerificationManager({
  identity,
  address,
}: {
  identity: VerificationRow | null;
  address: VerificationRow | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <VerifyCard
        kind="identity"
        current={identity}
        Icon={BadgeCheck}
        title="Identity"
        description="Upload a government-issued ID. Accepted: International Passport, Driver's License, or National ID (NIN)."
      />
      <VerifyCard
        kind="address"
        current={address}
        Icon={MapPin}
        title="Proof of address"
        description="Upload a recent document showing your name and address (e.g. a utility bill or bank statement)."
      />
    </div>
  );
}

function StatusBadge({ status }: { status: VerificationRow["status"] }) {
  if (status === "verified") {
    return (
      <span className="border-eten-verified/30 bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
        <BadgeCheck className="size-3.5" />
        Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="border-destructive/30 bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
        <X className="size-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="border-eten-line text-eten-ink-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
      <Clock className="size-3.5" />
      Pending review
    </span>
  );
}

function VerifyCard({
  kind,
  current,
  Icon,
  title,
  description,
}: {
  kind: "identity" | "address";
  current: VerificationRow | null;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isVerified = current?.status === "verified";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("kind", kind);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/member/verification", {
          method: "POST",
          body: formData,
        });
        const data: { ok?: true; error?: string } = await res
          .json()
          .catch(() => ({}));
        if (!res.ok || data.error) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        formRef.current?.reset();
        router.refresh();
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <section className="bg-eten-panel border-eten-line rounded-2xl border p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-display text-body-lg text-eten-ink inline-flex items-center gap-2 font-bold">
          <Icon className="text-eten-accent size-5" />
          {title}
        </h2>
        {current && <StatusBadge status={current.status} />}
      </div>
      <p className="text-eten-ink-muted mb-4 text-sm">{description}</p>

      {current && (
        <div className="border-eten-line-soft mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3 text-sm">
          {current.kind === "identity" && current.documentType && (
            <span className="text-eten-ink font-medium">
              {ID_TYPE_LABEL[current.documentType]}
            </span>
          )}
          <a
            href={`/api/member/verification?path=${encodeURIComponent(current.filePath)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-eten-accent inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <FileText className="size-4" />
            View submitted file
          </a>
        </div>
      )}

      {current?.status === "rejected" && current.reviewNote && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          <span className="font-semibold">Reason:</span> {current.reviewNote}
        </p>
      )}

      {isVerified ? (
        <p className="text-eten-ink-muted text-sm">
          Your {title.toLowerCase()} has been verified. No further action
          needed.
        </p>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {kind === "identity" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="documentType" className={labelClass}>
                Document type
              </label>
              <select
                id="documentType"
                name="documentType"
                required
                defaultValue=""
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a document…
                </option>
                <option value="passport">International Passport</option>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="nin">National ID (NIN)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor={`file-${kind}`} className={labelClass}>
              {current ? "Replace document" : "Document"}{" "}
              <span className="text-eten-ink-muted/60 lowercase">
                (PDF or image, 10 MB max)
              </span>
            </label>
            <input
              id={`file-${kind}`}
              name="file"
              type="file"
              required
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="text-eten-ink-muted file:bg-eten-hover file:text-eten-ink hover:file:bg-eten-hover/70 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="eten"
              size="pill-sm"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : current ? (
                "Resubmit for review"
              ) : (
                "Submit for review"
              )}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
