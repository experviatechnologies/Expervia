import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Footer for the public ETEN Mentorship pages, matching the Expervia site
 * footer (deep indigo band, uppercase column heads). Links that leave the
 * product are absolute so they work from the mentorship subdomain too.
 */
const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Programme",
    links: [
      ["How it works", "/mentorship#how"],
      ["Who can mentor", "/mentorship#mentors"],
      ["Enterprise programmes", "/mentorship#enterprise"],
      ["FAQ", "/mentorship#faq"],
    ],
  },
  {
    title: "Get started",
    links: [
      ["Apply as a mentee", "/mentorship/register?role=mentee"],
      ["Become a mentor", "/mentorship/register?role=mentor"],
      ["Sign in", "/mentorship/signin"],
    ],
  },
  {
    title: "Expervia",
    links: [
      ["ETEN Expert Network", `${siteConfig.url}/join-eten`],
      ["Events", `${siteConfig.url}/events`],
      ["Women in Tech", `${siteConfig.url}/women-in-tech`],
      ["Contact", `${siteConfig.url}/contact`],
    ],
  },
];

const linkClass =
  "text-brand-100/85 hover:text-white rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

export function MntFooter() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-bold tracking-tight text-white">
              ETEN Mentorship
            </span>
            <span className="text-brand-200 mt-1 text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
              By Expervia Technologies
            </span>
          </span>
          <p className="text-brand-100/80 mt-6 max-w-sm leading-relaxed">
            Part of the Expervia Technology Experts Network (ETEN). Structured
            mentorship that helps African technology professionals build real
            capability, confidence and visibility.
          </p>
          <Link
            href="/mentorship/register?role=mentee"
            className="text-brand-950 hover:bg-brand-50 mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold tracking-[0.08em] uppercase transition"
          >
            Start your journey
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
              {col.title}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="text-brand-100/70 mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Expervia Technologies. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
