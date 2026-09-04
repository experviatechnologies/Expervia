import type { LucideIcon } from "lucide-react";

/**
 * Placeholder for an app section whose feature build lands in a later milestone.
 * Keeps navigation coherent now (M0.7) while Feed/Pods/Messages/Notifications
 * are still empty routes.
 */
export function SectionStub({
  eyebrow,
  title,
  description,
  milestone,
  Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  milestone: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
          {title}
        </h1>
      </header>

      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-12 text-center">
        <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Icon className="size-7" />
        </span>
        <h2 className="font-display text-body-lg text-on-surface font-bold">
          Coming soon
        </h2>
        <p className="text-on-surface-variant max-w-md text-sm">
          {description}
        </p>
        <span className="border-outline-variant text-on-surface-variant rounded-full border px-3 py-1 font-mono text-xs">
          Ships in {milestone}
        </span>
      </div>
    </div>
  );
}
