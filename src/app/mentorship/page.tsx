import Link from "next/link";
import { MntNav } from "@/components/mentorship/mnt-nav";

/**
 * MP-1.1 scaffold landing. Confirms the mentorship route group, theme and nav
 * render on their own ground. The full landing (hero, domains marquee, ladder,
 * FAQ, footer) lands in MP-1.2, built from the approved mockup.
 */
export default function MentorshipLandingPage() {
  return (
    <>
      <MntNav />
      <main className="mx-auto flex max-w-[1140px] flex-col items-center px-6 py-28 text-center">
        <span className="border-mnt-brand/30 bg-mnt-brand/10 text-mnt-brand inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11.5px] tracking-[0.14em] uppercase">
          ETEN Mentorship Circles
        </span>
        <h1 className="text-mnt-ink font-display mt-6 max-w-3xl text-5xl leading-[1.06] font-extrabold tracking-tight text-balance">
          Your career shouldn&apos;t be built{" "}
          <span className="text-mnt-brand">alone.</span>
        </h1>
        <p className="text-mnt-ink-muted mt-5 max-w-xl text-lg leading-relaxed">
          Grow real capability with a verified mentor. Join a small Circle, set
          a goal, and build evidence that moves you up the readiness ladder.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/mentorship/register"
            className="bg-mnt-brand text-mnt-on-brand rounded-[11px] px-6 py-3.5 text-[15px] font-bold transition hover:brightness-110"
          >
            Be a Mentee
          </Link>
          <Link
            href="/mentorship/register"
            className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand rounded-[11px] border px-6 py-3.5 text-[15px] font-bold transition"
          >
            Be a Mentor
          </Link>
        </div>
        <p className="text-mnt-faint mt-16 font-mono text-xs tracking-wide">
          MP-1.1 scaffold · full landing arrives in MP-1.2
        </p>
      </main>
    </>
  );
}
