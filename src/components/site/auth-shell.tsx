import Link from "next/link";
import { NetworkGraphic } from "@/components/site/network-graphic";

/**
 * Split-screen layout for the account pages (sign in, sign up), from the Join
 * ETEN design: an indigo panel on the left (sticky on desktop, a short header
 * on mobile) and the white form column on the right.
 */
export function AuthShell({
  eyebrow,
  headline,
  aside,
  children,
}: {
  eyebrow: string;
  headline: string;
  /** Desktop-only extra content under the headline (steps, perks). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(380px,0.85fr)_1.15fr]">
      <aside className="bg-brand-950 relative isolate overflow-hidden text-white lg:sticky lg:top-0 lg:h-dvh">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(700px_500px_at_100%_0%,rgba(100,38,220,0.65),transparent_60%),linear-gradient(165deg,#21005D_0%,#2D006B_60%,#1A0049_100%)]"
        />
        <NetworkGraphic
          idPrefix="auth"
          className="absolute -right-28 -bottom-24 -z-10 w-[460px] opacity-40 max-lg:hidden"
        />
        <div className="flex h-full flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <Link
            href="/join-eten"
            aria-label="Back to the ETEN page"
            className="focus-visible:ring-brand-300 self-start rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex flex-col leading-none">
              <span className="text-[1.05rem] font-bold tracking-tight text-white">
                Expervia Technologies
              </span>
              <span className="text-brand-200 mt-1 text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
                Expert Network · ETEN
              </span>
            </span>
          </Link>
          <div className="mt-8 lg:mt-auto lg:mb-auto">
            <p className="text-brand-200 text-xs font-bold tracking-[0.22em] uppercase">
              {eyebrow}
            </p>
            <p className="font-jakarta mt-3 text-2xl leading-tight font-extrabold sm:text-3xl lg:text-[2.4rem]">
              {headline}
            </p>
            {aside && <div className="mt-10 hidden lg:block">{aside}</div>}
          </div>
          <p className="text-brand-200/70 mt-6 hidden text-sm lg:block">
            An initiative of Expervia Technologies.
          </p>
        </div>
      </aside>
      {/* Not <main>: SiteChrome already wraps bare routes in one. */}
      <div className="flex justify-center px-5 py-10 sm:px-8 sm:py-14 lg:items-center lg:px-12">
        <div className="w-full max-w-[600px]">{children}</div>
      </div>
    </div>
  );
}

/** Shared field styles for the account forms. */
export const authInputClass =
  "block w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-[0.98rem] text-ink shadow-[0_1px_2px_rgba(33,0,93,0.04)] transition placeholder:text-ink/40 hover:border-brand-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/10";
export const authLabelClass = "text-sm font-semibold text-brand-950";
export const authSubmitClass =
  "group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-7 py-3.5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(100,38,220,0.8)] transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-80";
export const authLinkClass =
  "font-semibold text-brand-700 underline-offset-2 hover:underline";
export const authPasswordToggleClass = "text-ink/50 hover:text-brand-700";
export const authErrorClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";
