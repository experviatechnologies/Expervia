"use client";

import { useState } from "react";
import Link from "next/link";

const DOMAINS = [
  "Cloud and Infrastructure",
  "Modern Work / M365",
  "Cybersecurity",
  "Data and AI",
  "Business Applications",
  "Software Development",
  "Digital Transformation",
  "Technology Leadership",
];

const LEVELS = [
  "V0 · Registered",
  "V1 · Credential Verified",
  "V2 · Capability Verified",
  "V3 · Commercially Ready",
];

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#586273]";
const labelClass = "text-mnt-ink-muted text-[12.5px] font-medium";

export default function MentorshipRegisterPage() {
  const [role, setRole] = useState<"mentee" | "mentor">("mentee");

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
      {/* LEFT brand panel (desktop) */}
      <aside className="border-mnt-line relative hidden flex-col justify-between border-r p-12 [background:linear-gradient(160deg,#0f1520,#0b0e13)] lg:flex">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br font-extrabold">
            E
          </span>
          <span className="font-display text-[15px] font-extrabold">
            ETEN Mentorship
          </span>
        </Link>

        <div>
          <h1 className="font-display max-w-[18rem] text-[34px] leading-[1.12] font-extrabold text-balance">
            Two minutes to start. A capability that lasts.
          </h1>
          <ul className="mt-7 flex flex-col gap-4">
            {[
              [
                "Mentored by verified specialists",
                "matched to your capability goal.",
              ],
              [
                "Evidence that counts",
                "approved work builds your capability passport.",
              ],
              [
                "A path into ETEN",
                "validate your account to unlock live Circles.",
              ],
            ].map(([lead, rest]) => (
              <li key={lead} className="flex items-start gap-3">
                <span className="bg-mnt-brand/14 text-mnt-brand mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-md text-[13px]">
                  ✓
                </span>
                <span className="text-mnt-ink-muted text-[13.5px] leading-relaxed">
                  <b className="text-mnt-ink">{lead}</b>, {rest}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-mnt-faint text-[12px]">
          Already have an account?{" "}
          <Link href="/mentorship/signin" className="text-mnt-brand">
            Sign in
          </Link>
        </div>
      </aside>

      {/* RIGHT form */}
      <main className="flex flex-col justify-center px-6 py-14 sm:px-14">
        <div className="mx-auto w-full max-w-[520px]">
          {/* mobile logo */}
          <Link
            href="/mentorship"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
          >
            <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br font-extrabold">
              E
            </span>
            <span className="font-display text-[15px] font-extrabold">
              ETEN Mentorship
            </span>
          </Link>

          <h2 className="font-display text-2xl font-extrabold">
            Create your account
          </h2>
          <p className="text-mnt-ink-muted mt-2 text-[14px]">
            Choose how you want to take part. You can be both later.
          </p>

          {/* role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <RoleCard
              selected={role === "mentee"}
              onClick={() => setRole("mentee")}
              title="Be a Mentee"
              desc="Join a Circle and grow toward a target V-level."
            />
            <RoleCard
              selected={role === "mentor"}
              onClick={() => setRole("mentor")}
              title="Be a Mentor"
              desc="Lead a Circle once you are a verified mentor."
            />
          </div>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Amara Okoye"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="domain" className={labelClass}>
                  Capability area
                </label>
                <select id="domain" name="domain" className={inputClass}>
                  {DOMAINS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="level" className={labelClass}>
                  {role === "mentor" ? "Your level" : "Current level"}
                </label>
                <select id="level" name="level" className={inputClass}>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3.5">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              className="bg-mnt-brand text-mnt-on-brand mt-6 w-full rounded-[11px] py-3.5 text-[15px] font-bold transition hover:brightness-110"
            >
              Create account
            </button>
          </form>

          {/* prospect callout */}
          <div className="border-mnt-amber/28 mt-[18px] flex items-start gap-3 rounded-xl border p-3.5 [background:rgba(245,177,61,0.07)]">
            <span className="bg-mnt-amber/18 text-mnt-amber mt-px grid size-5 shrink-0 place-items-center rounded-full text-[12px]">
              !
            </span>
            <p className="text-mnt-ink-muted text-[12.5px] leading-relaxed">
              You will join as a <b className="text-mnt-amber">Prospect</b>.
              Complete <b className="text-mnt-ink">ETEN validation</b> after
              signing up to be fully activated as a {role}, and to join live
              Circles.
            </p>
          </div>

          <p className="text-mnt-faint mt-4 text-center text-[11.5px]">
            By continuing you agree to the ETEN terms and privacy practices.
          </p>
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "rounded-[14px] border p-4 text-left transition " +
        (selected
          ? "border-mnt-brand [background:rgba(167,140,250,0.08)]"
          : "border-mnt-line bg-mnt-panel-2 hover:border-mnt-line-strong")
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-bold">{title}</span>
        <span
          className={
            "grid size-[18px] place-items-center rounded-full border-2 " +
            (selected ? "border-mnt-brand" : "border-mnt-line-strong")
          }
        >
          {selected && <span className="bg-mnt-brand size-2 rounded-full" />}
        </span>
      </div>
      <div className="text-mnt-ink-muted mt-1.5 text-[12.5px] leading-relaxed">
        {desc}
      </div>
    </button>
  );
}
