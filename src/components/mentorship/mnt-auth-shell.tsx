import { AuthShell } from "@/components/site/auth-shell";

/**
 * The site's split-screen account layout, branded for ETEN Mentorship. Used by
 * the mentorship sign-in, register and password pages (not wrapped by
 * SiteChrome, so the form column renders as <main>).
 */
export function MntAuthShell({
  eyebrow,
  headline,
  aside,
  children,
}: {
  eyebrow: string;
  headline: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AuthShell
      asMain
      eyebrow={eyebrow}
      headline={headline}
      aside={aside}
      brand={{
        href: "/mentorship",
        label: "ETEN Mentorship home",
        name: "ETEN Mentorship",
        tagline: "By Expervia Technologies",
      }}
      footnote="Part of the Expervia Technology Experts Network (ETEN)."
    >
      {children}
    </AuthShell>
  );
}

/** Icon + title + text rows for the indigo panel (desktop). */
export function MntAuthPerks({
  items,
  label,
}: {
  items: readonly {
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    title: string;
    text: string;
  }[];
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-col gap-5">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-4">
          <span className="text-brand-100 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Icon aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-brand-100/65 mt-0.5 text-sm">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
