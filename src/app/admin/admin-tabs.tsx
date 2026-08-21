import { FileText, CalendarCheck } from "lucide-react";

// Top-level admin navigation: switch between the two submission streams.
// Community applications and event registrations live in separate tables, so
// they get separate pages rather than one merged list.
const TABS = [
  { key: "applications", label: "Community Applications", href: "/admin/applications", Icon: FileText },
  { key: "events", label: "Event Registrations", href: "/admin/events", Icon: CalendarCheck },
] as const;

export function AdminTabs({ active }: { active: "applications" | "events" }) {
  return (
    <div className="border-outline-variant mb-6 flex flex-wrap gap-2 border-b pb-3">
      {TABS.map(({ key, label, href, Icon }) => {
        const isActive = key === active;
        return (
          <a
            key={key}
            href={href}
            className={
              isActive
                ? "bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                : "border-outline-variant text-on-surface-variant hover:text-on-surface inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
            }
          >
            <Icon className="size-4" />
            {label}
          </a>
        );
      })}
    </div>
  );
}
