"use client";

import { useRef, useState, useTransition } from "react";
import {
  BadgeCheck,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addCertification,
  deleteCertification,
  updateCertification,
} from "./actions";
import {
  CERT_NAME_SUGGESTIONS,
  CERT_ISSUER_SUGGESTIONS,
} from "@/lib/eten/certifications-catalog";

export type Certification = {
  id: string;
  name: string;
  issuer: string | null;
  credentialId: string | null;
  dateObtained: string | null;
  expiryDate: string | null;
  verificationStatus: "unverified" | "verified" | "rejected";
  certificatePath: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-3 text-sm text-eten-ink outline-none transition-all focus:border-eten-accent placeholder:text-eten-ink-muted/60";
const labelClass = "text-label-sm text-eten-ink-muted font-mono uppercase";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CertificationsManager({
  certifications,
}: {
  certifications: Certification[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {certifications.length === 0 && !adding && (
        <div className="bg-eten-panel border-eten-line text-eten-ink-muted flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
          <BadgeCheck className="text-eten-ink-muted/40 size-9" />
          <p className="text-sm">
            No certifications yet. Add the credentials that back up your
            expertise — they&apos;re the core of your ETEN profile.
          </p>
        </div>
      )}

      {certifications.map((cert) =>
        editingId === cert.id ? (
          <CertForm
            key={cert.id}
            cert={cert}
            onError={setError}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <CertCard
            key={cert.id}
            cert={cert}
            disabled={adding || editingId !== null}
            onEdit={() => {
              setError(null);
              setEditingId(cert.id);
            }}
            onError={setError}
          />
        ),
      )}

      {adding ? (
        <CertForm onError={setError} onDone={() => setAdding(false)} />
      ) : (
        <Button
          type="button"
          variant="etenOutline"
          size="pill-sm"
          className="self-start"
          disabled={editingId !== null}
          onClick={() => {
            setError(null);
            setAdding(true);
          }}
        >
          <Plus className="size-4" />
          Add certification
        </Button>
      )}
    </div>
  );
}

function VerificationBadge({
  status,
}: {
  status: Certification["verificationStatus"];
}) {
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
      Pending verification
    </span>
  );
}

function CertCard({
  cert,
  disabled,
  onEdit,
  onError,
}: {
  cert: Certification;
  disabled: boolean;
  onEdit: () => void;
  onError: (msg: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete “${cert.name}”? This also removes its uploaded file. This can't be undone.`,
      )
    ) {
      return;
    }
    onError(null);
    startTransition(async () => {
      const res = await deleteCertification({ id: cert.id });
      if ("error" in res) onError(res.error);
    });
  }

  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-eten-ink font-semibold">{cert.name}</h3>
          {cert.issuer && (
            <p className="text-eten-ink-muted text-sm">{cert.issuer}</p>
          )}
        </div>
        <VerificationBadge status={cert.verificationStatus} />
      </div>

      <dl className="text-eten-ink-muted mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        {cert.credentialId && (
          <div>
            <dt className="text-eten-ink-muted/60 inline">ID: </dt>
            <dd className="text-eten-ink inline font-mono">
              {cert.credentialId}
            </dd>
          </div>
        )}
        {cert.dateObtained && (
          <div>
            <dt className="text-eten-ink-muted/60 inline">Obtained: </dt>
            <dd className="text-eten-ink inline">
              {formatDate(cert.dateObtained)}
            </dd>
          </div>
        )}
        {cert.expiryDate && (
          <div>
            <dt className="text-eten-ink-muted/60 inline">Expires: </dt>
            <dd className="text-eten-ink inline">
              {formatDate(cert.expiryDate)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex items-center gap-2">
        {cert.certificatePath && (
          <a
            href={`/api/member/certificate?path=${encodeURIComponent(
              cert.certificatePath,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-eten-accent inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <FileText className="size-4" />
            View file
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit certification"
            disabled={disabled || pending}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete certification"
            className="text-eten-ink-muted hover:text-destructive"
            disabled={disabled || pending}
            onClick={handleDelete}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertForm({
  cert,
  onError,
  onDone,
}: {
  cert?: Certification;
  onError: (msg: string | null) => void;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(cert);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (cert) formData.append("id", cert.id);
    onError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateCertification(formData)
        : await addCertification(formData);
      if ("error" in res) onError(res.error);
      else onDone();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-eten-panel border-eten-line flex flex-col gap-4 rounded-2xl border p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-body-lg text-eten-ink font-bold">
          {isEdit ? "Edit certification" : "New certification"}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Certification name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={160}
            list="cert-name-options"
            defaultValue={cert?.name ?? ""}
            className={fieldClass}
            placeholder="e.g. Microsoft Certified: Azure Solutions Architect Expert"
          />
          <datalist id="cert-name-options">
            {CERT_NAME_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="issuer" className={labelClass}>
            Issuer
          </label>
          <input
            id="issuer"
            name="issuer"
            maxLength={120}
            list="cert-issuer-options"
            defaultValue={cert?.issuer ?? ""}
            className={fieldClass}
            placeholder="e.g. Microsoft"
          />
          <datalist id="cert-issuer-options">
            {CERT_ISSUER_SUGGESTIONS.map((issuer) => (
              <option key={issuer} value={issuer} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="credentialId" className={labelClass}>
            Credential ID
          </label>
          <input
            id="credentialId"
            name="credentialId"
            maxLength={120}
            defaultValue={cert?.credentialId ?? ""}
            className={fieldClass}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="dateObtained" className={labelClass}>
            Date obtained
          </label>
          <input
            id="dateObtained"
            name="dateObtained"
            type="date"
            defaultValue={cert?.dateObtained ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="expiryDate" className={labelClass}>
            Expiry date
          </label>
          <input
            id="expiryDate"
            name="expiryDate"
            type="date"
            defaultValue={cert?.expiryDate ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="file" className={labelClass}>
            Certificate file{" "}
            <span className="text-eten-ink-muted/60 lowercase">
              (PDF or image, 10 MB max
              {isEdit ? " — leave empty to keep current" : ""})
            </span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="text-eten-ink-muted file:bg-eten-hover file:text-eten-ink hover:file:bg-eten-hover/70 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
          />
          {isEdit && cert?.certificatePath && (
            <p className="text-eten-ink-muted/70 text-xs">
              A file is already attached. Uploading a new one replaces it.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="pill-sm"
          disabled={pending}
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button type="submit" variant="eten" size="pill-sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add certification"
          )}
        </Button>
      </div>
    </form>
  );
}
