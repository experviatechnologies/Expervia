import {
  FileText,
  CalendarCheck,
  Tags,
  Users,
  UserPlus,
  BadgeCheck,
} from "lucide-react";

// Top-level admin navigation. The submission streams (community applications
// and event registrations) live in separate tables, so they get separate pages;
// Members administers ETEN accounts; the skills taxonomy is the platform's
// shared vocabulary.
const TABS = [
  {
    key: "applications",
    label: "Community Applications",
    href: "/admin/applications",
    Icon: FileText,
  },
  {
    key: "events",
    label: "Event Registrations",
    href: "/admin/events",
    Icon: CalendarCheck,
  },
  { key: "members", label: "Members", href: "/admin/members", Icon: Users },
  {
    key: "certifications",
    label: "Certifications",
    href: "/admin/certifications",
    Icon: BadgeCheck,
  },
  {
    key: "migration",
    label: "Migration",
    href: "/admin/migration",
    Icon: UserPlus,
  },
  {
    key: "taxonomy",
    label: "Skills Taxonomy",
    href: "/admin/taxonomy",
    Icon: Tags,
  },
] as const;

export function AdminTabs({
  active,
}: {
  active:
    | "applications"
    | "events"
    | "taxonomy"
    | "members"
    | "migration"
    | "certifications";
}) {
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
