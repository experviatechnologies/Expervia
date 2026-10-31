"use client";

/**
 * Small UI kit for the presales tracker, built on the eten-* / trk-* tokens so
 * it follows the app-wide light/dark toggle. Kept local to the tracker so its
 * density (tables, pills, compact forms) doesn't leak into other surfaces.
 */
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tracker/labels";
import { initials } from "@/lib/tracker/selectors";

// ------------------------------------------------------------------ pills

const TONE: Record<Tone, string> = {
  neutral: "bg-eten-line-soft text-eten-ink-muted border-eten-line",
  brand: "bg-eten-accent-soft text-eten-accent border-eten-accent/20",
  info: "bg-trk-info-soft text-trk-info border-trk-info/20",
  success: "bg-eten-verified-soft text-eten-verified border-eten-verified/20",
  warning: "bg-trk-warn-soft text-trk-warn border-trk-warn/25",
  danger: "bg-trk-danger-soft text-trk-danger border-trk-danger/25",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] leading-[18px] font-semibold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ buttons

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
const BTN: Record<BtnVariant, string> = {
  primary:
    "bg-eten-accent text-white hover:bg-eten-accent-press border-transparent shadow-sm",
  secondary: "bg-eten-panel text-eten-ink border-eten-line hover:bg-eten-hover",
  subtle:
    "bg-eten-accent-soft text-eten-accent border-transparent hover:bg-eten-accent/15",
  ghost:
    "bg-transparent text-eten-ink-muted border-transparent hover:bg-eten-hover hover:text-eten-ink",
  danger:
    "bg-eten-panel text-trk-danger border-trk-danger/30 hover:bg-trk-danger-soft",
};

export function btnClass(
  variant: BtnVariant = "secondary",
  size: "sm" | "md" = "md",
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eten-accent",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
    BTN[variant],
  );
}

export function Btn({
  variant = "secondary",
  size = "md",
  href,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={cn(btnClass(variant, size), className)}>
        {props.children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cn(btnClass(variant, size), className)}
      {...props}
    />
  );
}

// ------------------------------------------------------------------ layout

export function PageHeader({
  title,
  description,
  actions,
  crumb,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  crumb?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-[320px]">
        {crumb && (
          <Link
            href={crumb.href}
            className="text-eten-faint hover:text-eten-accent mb-2 inline-block text-[13px]"
          >
            {crumb.label}
          </Link>
        )}
        <h1 className="text-eten-ink text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <div className="text-eten-ink-muted mt-1.5 max-w-[760px] text-[14.5px]">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "border-eten-line bg-eten-panel rounded-2xl border",
        className,
      )}
    >
      {(title || action) && (
        <header className="border-eten-line flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-eten-ink text-[15.5px] font-bold">{title}</h2>
            )}
            {description && (
              <p className="text-eten-ink-muted mt-0.5 text-[13px]">
                {description}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={cn(bodyClassName ?? "p-5")}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-eten-faint mb-3 text-[12px] font-bold tracking-[0.12em] uppercase">
      {children}
    </h2>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "danger" | "success";
  href?: string;
}) {
  const body = (
    <>
      <span className="text-eten-ink-muted block text-[13px] leading-snug">
        {label}
      </span>
      <span
        className={cn(
          "mt-2 block text-[26px] leading-none font-extrabold tracking-[-0.02em]",
          tone === "danger"
            ? "text-trk-danger"
            : tone === "success"
              ? "text-eten-verified"
              : "text-eten-ink",
        )}
      >
        {value}
      </span>
      {sub && (
        <span className="text-eten-faint mt-1.5 block text-[12.5px]">
          {sub}
        </span>
      )}
    </>
  );
  const cls = "border-eten-line bg-eten-panel block rounded-2xl border p-4";
  return href ? (
    <Link
      href={href}
      className={cn(cls, "hover:border-eten-accent/40 transition-colors")}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-eten-ink text-[15px] font-bold">{title}</p>
      {children && (
        <p className="text-eten-ink-muted mx-auto mt-1 max-w-[420px] text-[13.5px]">
          {children}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3",
        TONE[tone],
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-[13.5px] font-normal">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      className="bg-eten-accent-soft text-eten-accent grid shrink-0 place-items-center rounded-full font-bold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function DefList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-eten-faint text-[11.5px] font-bold tracking-[0.08em] uppercase">
            {k}
          </dt>
          <dd className="text-eten-ink mt-1 text-[14.5px] break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ tables

export const th =
  "text-eten-faint px-4 py-2.5 text-left text-[11.5px] font-bold tracking-[0.08em] uppercase whitespace-nowrap";
export const td = "px-4 py-3 align-top text-[14px]";

export function Table({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[640px] border-collapse"
        aria-label={label}
      >
        {children}
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ tabs

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="border-eten-line mb-5 flex gap-1 overflow-x-auto border-b"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[14px] font-semibold transition-colors",
              active
                ? "border-eten-accent text-eten-accent"
                : "text-eten-ink-muted hover:text-eten-ink border-transparent",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[12px]",
                  active ? "bg-eten-accent-soft" : "bg-eten-line-soft",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ forms

export const inputClass =
  "border-eten-line bg-eten-panel text-eten-ink placeholder:text-eten-faint h-10 w-full rounded-xl border px-3 text-[14px] focus:border-eten-accent focus:outline-none focus:ring-2 focus:ring-eten-accent/15 disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="text-eten-ink mb-1.5 block text-[13px] font-semibold"
      >
        {label}
        {required && <span className="text-trk-danger"> *</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-trk-danger mt-1 text-[12.5px]" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-eten-faint mt-1 text-[12.5px]">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-eten-ink flex cursor-pointer items-start gap-2.5 text-[14px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-eten-accent mt-0.5 size-4 shrink-0"
      />
      <span>{children}</span>
    </label>
  );
}

export function ChipToggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg border px-3 text-[13px] font-semibold transition-colors",
        on
          ? "border-eten-accent/40 bg-eten-accent-soft text-eten-accent"
          : "border-eten-line bg-eten-panel text-eten-ink-muted hover:text-eten-ink",
      )}
    >
      {on && "✓ "}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ dialog

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(
      () =>
        ref.current
          ?.querySelector<HTMLElement>("input,select,textarea,button")
          ?.focus(),
      0,
    );
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      data-app-surface
    >
      <div
        className="absolute inset-0 bg-[#0b0820]/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "border-eten-line bg-eten-panel text-eten-ink relative flex max-h-[90vh] w-full flex-col rounded-2xl border shadow-2xl",
          wide ? "max-w-[760px]" : "max-w-[520px]",
        )}
      >
        <header className="border-eten-line flex items-start gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold">{title}</h2>
            {description && (
              <p className="text-eten-ink-muted mt-0.5 text-[13.5px]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-eten-faint hover:text-eten-ink rounded-lg p-1"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-eten-line flex flex-wrap justify-end gap-2 border-t px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ toast

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<{ id: number; text: string }[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setMsgs((m) => [...m, { id, text }]);
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2"
        aria-live="polite"
      >
        {msgs.map((m) => (
          <div
            key={m.id}
            className="bg-eten-ink text-eten-panel rounded-xl px-4 py-2.5 text-[13.5px] font-semibold shadow-lg"
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
