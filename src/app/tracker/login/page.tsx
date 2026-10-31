"use client";

/**
 * Demo sign-in: pick one of five fictional personas to see the tracker as that
 * role. Phase 2 replaces this with the real ETEN sign-in (and MFA for the
 * privileged roles, PRD FR-004).
 */
import { useRouter } from "next/navigation";
import { ArrowRight, Info, RotateCcw } from "lucide-react";
import { PERSONAS, useTracker } from "@/lib/tracker/store";
import { ROLE_LABEL } from "@/lib/tracker/labels";
import { Avatar } from "@/components/tracker/ui";

export default function TrackerLogin() {
  const t = useTracker();
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-[linear-gradient(120deg,#110263_0%,#35007f_55%,#7530e6_100%)] px-4 pt-10 pb-28 text-white">
        <div
          className="pointer-events-none absolute -top-40 -right-24 size-[420px] rounded-full border border-white/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 -right-6 size-[300px] rounded-full border border-white/10"
          aria-hidden
        />
        <div className="relative mx-auto max-w-[960px]">
          <span className="inline-flex rounded-xl bg-white px-4 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/expervia-logo.png"
              alt="Expervia Technologies"
              className="h-auto w-[140px]"
            />
          </span>
          <h1 className="mt-7 text-[30px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[38px]">
            ETEN Availability &amp; Presales Coordination
          </h1>
          <p className="mt-3 max-w-[660px] text-[15.5px] text-white/85">
            Find the right Expervia Technology Experts Network engineers for
            client meetings: availability, Pod Leader nominations, Sales Manager
            selection, confirmation and outcomes in one place.
          </p>
        </div>
      </div>

      <div className="relative mx-auto -mt-20 max-w-[960px] px-4 pb-16">
        <section className="border-eten-line bg-eten-panel rounded-2xl border p-5 shadow-[0_20px_50px_-30px_rgba(23,18,61,0.45)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[19px] font-bold">Choose a demo account</h2>
              <p className="text-eten-ink-muted mt-1 max-w-[620px] text-[14px]">
                Each account shows the app as that role sees it. Permissions are
                applied exactly as they will be in production.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Reset the demo data? All changes made in this browser will be lost.",
                  )
                )
                  t.reset();
              }}
              className="text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 text-[13px] font-semibold"
            >
              <RotateCcw className="size-3.5" /> Reset demo data
            </button>
          </div>

          <div className="border-eten-accent/20 bg-eten-accent-soft mt-5 flex gap-2.5 rounded-xl border px-4 py-3 text-[13.5px]">
            <Info
              className="text-eten-accent mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <p>
              <strong>Demo mode.</strong> Every person, client and number is
              fictional sample data stored only in this browser. Sign-in here
              skips passwords; the production build uses the ETEN sign-in with
              multi-factor authentication for privileged roles.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!t.ready
              ? PERSONAS.map((p) => (
                  <div
                    key={p.id}
                    className="border-eten-line h-[150px] animate-pulse rounded-2xl border"
                  />
                ))
              : PERSONAS.map((p) => {
                  const m = t.data.members.find((x) => x.id === p.id);
                  if (!m) return null;
                  const roleText = m.roles
                    .map((r) => ROLE_LABEL[r])
                    .join(" · ");
                  const current = t.me?.id === m.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        t.signIn(m.id);
                        router.push("/tracker/dashboard");
                      }}
                      className="border-eten-line hover:border-eten-accent/50 focus-visible:outline-eten-accent group flex flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2"
                    >
                      <span className="flex items-center gap-3">
                        <Avatar name={m.name} size={38} />
                        <span className="min-w-0">
                          <span className="block text-[15.5px] font-bold">
                            {m.name}
                          </span>
                          <span className="text-eten-accent block text-[12.5px] font-semibold">
                            {roleText}
                          </span>
                        </span>
                      </span>
                      <span className="text-eten-ink-muted mt-3 flex-1 text-[14px]">
                        {p.blurb}
                      </span>
                      <span className="text-eten-accent mt-3 inline-flex items-center gap-1 text-[14px] font-semibold">
                        {current ? "Continue as current account" : "Continue"}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
          </div>
        </section>
      </div>
    </div>
  );
}
