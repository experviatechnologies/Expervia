import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, IdCard, Search, Target } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { vLevelBadge } from "@/lib/eten/v-levels";
import {
  summarizeRecognition,
  type RecognitionRow,
} from "@/lib/eten/recognition-types";
import { ApplyMentorControl } from "../mentor/apply-control";

export const metadata = { title: "Dashboard" };

const EYEBROW =
  "text-mnt-faint font-mono text-[11px] font-bold tracking-[0.08em] uppercase";

export default async function MenteeDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("members")
      .select("validated_at, mentorship_intent, mentorship_capability_area_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("member_id", user.id)
      .maybeSingle(),
  ]);

  if (member?.mentorship_intent === "mentor") redirect("/mentorship/mentor");

  const isValidated = Boolean(member?.validated_at);
  const name = profile?.full_name ?? "there";
  const firstName = name.split(/\s+/)[0];

  let areaLabel: string | null = null;
  if (member?.mentorship_capability_area_id) {
    const { data: area } = await supabase
      .from("capability_areas")
      .select("label")
      .eq("id", member.mentorship_capability_area_id)
      .maybeSingle();
    areaLabel = area?.label ?? null;
  }

  const { data: pendingNom } = await supabase
    .from("mentor_nominations")
    .select("id")
    .eq("member_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  const hasPendingMentorApp = Boolean(pendingNom);
  let mentorAreas: { slug: string; label: string }[] = [];
  if (isValidated && !hasPendingMentorApp) {
    const { data: areaList } = await supabase
      .from("capability_areas")
      .select("slug, label")
      .eq("active", true)
      .order("sort_order");
    mentorAreas = areaList ?? [];
  }

  const { data: cm } = await supabase
    .from("circle_memberships")
    .select("circle_id, target_v_level, target_capability")
    .eq("member_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let circle: {
    id: string;
    title: string | null;
    status: string;
    mentorName: string;
  } | null = null;
  if (cm) {
    const { data: c } = await supabase
      .from("mentorship_circles")
      .select("id, title, status, mentor_id")
      .eq("id", cm.circle_id)
      .maybeSingle();
    if (c) {
      const { data: mp } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("member_id", c.mentor_id)
        .maybeSingle();
      circle = {
        id: c.id,
        title: c.title,
        status: c.status,
        mentorName: mp?.full_name ?? "A mentor",
      };
    }
  }

  const [{ data: recRows }, { data: evidenceRows }] = await Promise.all([
    supabase
      .from("recognition_events")
      .select("kind, badge_key, points")
      .eq("member_id", user.id),
    supabase
      .from("evidence_records")
      .select("title, capability_area, v_level")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const { score, badges } = summarizeRecognition(
    (recRows ?? []) as RecognitionRow[],
  );
  const evidence = evidenceRows ?? [];

  const { data: reqRows } = await supabase
    .from("mentorship_requests")
    .select("id, mentor_id, status, created_at")
    .eq("mentee_id", user.id)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });
  const requests = reqRows ?? [];
  const requestMentorName = new Map<string, string>();
  if (requests.length) {
    const { data: mps } = await supabase
      .from("profiles")
      .select("member_id, full_name")
      .in(
        "member_id",
        requests.map((r) => r.mentor_id),
      );
    for (const p of mps ?? [])
      requestMentorName.set(p.member_id, p.full_name ?? "A mentor");
  }

  const acceptedReq = requests.find((r) => r.status === "accepted");
  const pendingReq = requests.some((r) => r.status === "pending");
  const hasCircle = Boolean(circle);
  const hasRecognition = score > 0 || badges.length > 0;

  type StepState = "done" | "now" | "todo";
  const journey: { label: string; sub: string; state: StepState }[] = [
    {
      label: "ETEN-validated",
      sub: isValidated ? "Account verified" : "Validate your account",
      state: isValidated ? "done" : "now",
    },
    {
      label: "1:1 mentor",
      sub: acceptedReq
        ? "Mentor accepted"
        : pendingReq
          ? "Request pending"
          : "Find a mentor",
      state: acceptedReq ? "done" : pendingReq ? "now" : "todo",
    },
    {
      label: "Join a Circle",
      sub: hasCircle
        ? (circle?.title ?? "In a Circle")
        : isValidated
          ? "Matching in progress"
          : "Validate to join",
      state: hasCircle ? "done" : isValidated ? "now" : "todo",
    },
    {
      label: "Earn recognition",
      sub: "Badges and Expert Score",
      state: hasRecognition ? "done" : "todo",
    },
  ];

  const stepDot = (state: StepState) =>
    "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-extrabold " +
    (state === "done"
      ? "bg-mnt-green text-white"
      : state === "now"
        ? "bg-mnt-brand ring-mnt-brand/15 text-white ring-4"
        : "bg-mnt-panel-2 text-mnt-faint");

  return (
    <div className="px-6 py-8 md:px-9">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
        {/* Heading */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-mnt-brand text-[12px] font-bold tracking-[0.12em] uppercase">
              Mentorship
            </span>
            <h1 className="font-display text-mnt-ink mt-1 text-[30px] font-extrabold tracking-[-0.02em]">
              Welcome back, {firstName}
            </h1>
            <p className="text-mnt-ink-muted mt-1.5 text-[15px]">
              Here&apos;s where your mentorship stands today.
            </p>
          </div>
          <Link
            href="/mentorship/mentors"
            className="bg-mnt-brand text-mnt-on-brand inline-flex h-11 items-center gap-2 rounded-xl px-[18px] text-sm font-bold"
          >
            <Search className="size-4" strokeWidth={2.2} />
            Find a mentor
          </Link>
        </div>

        {/* Prospect banner */}
        {!isValidated && (
          <div className="border-mnt-amber/30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
            <div className="flex items-center gap-3">
              <span className="bg-mnt-amber/18 text-mnt-amber grid size-[26px] place-items-center rounded-lg font-bold">
                !
              </span>
              <div>
                <div className="text-mnt-ink text-[14px] font-bold">
                  You are a Prospect, one step from going live
                </div>
                <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                  Validate through ETEN membership to be placed in a live Circle
                  and count toward recognition.
                </div>
              </div>
            </div>
            <Link
              href="/mentorship/validate"
              className="bg-mnt-amber rounded-[10px] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-[#241a05]"
            >
              Validate account
            </Link>
          </div>
        )}

        {/* Journey */}
        <section
          aria-label="Your mentorship journey"
          className="bg-mnt-panel border-mnt-line flex flex-wrap gap-3 rounded-[18px] border px-6 py-5"
        >
          {journey.map((j, i) => (
            <div
              key={j.label}
              className="flex flex-[1_1_180px] items-center gap-3"
            >
              <span className={stepDot(j.state)}>
                {j.state === "done" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0">
                <div className="text-mnt-ink text-[14px] font-bold">
                  {j.label}
                </div>
                <div className="text-mnt-faint text-[12px]">{j.sub}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Goal + Circle */}
        <div className="flex flex-wrap gap-5">
          <section className="bg-mnt-panel border-mnt-line flex flex-[1_1_320px] gap-4 rounded-[18px] border p-[22px]">
            <span className="bg-mnt-brand/10 text-mnt-brand grid size-12 shrink-0 place-items-center rounded-[14px]">
              <Target className="size-[22px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className={EYEBROW}>My goal</h2>
              {cm && cm.target_v_level != null ? (
                <>
                  <div className="text-mnt-ink mt-1 text-[18px] font-extrabold">
                    {vLevelBadge(cm.target_v_level)}
                  </div>
                  {cm.target_capability && (
                    <p className="text-mnt-ink-muted mt-1 text-[13px]">
                      {cm.target_capability}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-mnt-ink mt-1 text-[18px] font-extrabold">
                    {areaLabel ?? "Set when you join a Circle"}
                  </div>
                  <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
                    You&apos;ll set a target level when you join a Circle.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="bg-mnt-panel border-mnt-line flex flex-[1_1_320px] gap-4 rounded-[18px] border p-[22px]">
            <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-[22px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className={EYEBROW}>My Circle</h2>
              {circle ? (
                <Link href={`/mentorship/circles/${circle.id}`}>
                  <div className="text-mnt-ink mt-1 text-[18px] font-extrabold">
                    {circle.title ?? "Your Circle"}
                  </div>
                  <span className="text-mnt-brand mt-1 inline-flex items-center gap-1 text-[13px] font-semibold">
                    Mentor: {circle.mentorName}
                    <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              ) : (
                <>
                  <div className="text-mnt-ink mt-1 text-[18px] font-extrabold">
                    Not in a Circle yet
                  </div>
                  <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
                    {isValidated
                      ? "You'll be matched to one in your capability area."
                      : "Validate your account to be placed in a live Circle."}
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* 1:1 mentorship */}
        <section className="bg-mnt-panel border-mnt-line flex flex-col gap-3.5 rounded-[18px] border p-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-mnt-ink text-[17px] font-bold">
              1:1 mentorship
            </h2>
            <Link
              href="/mentorship/mentors"
              className="text-mnt-brand inline-flex items-center gap-1.5 text-sm font-bold"
            >
              Find a mentor <ArrowRight className="size-4" />
            </Link>
          </div>
          {acceptedReq ? (
            <div className="border-mnt-line bg-mnt-panel-2 flex flex-wrap items-center gap-3.5 rounded-[14px] border p-3.5">
              <span className="bg-mnt-brand/12 text-mnt-brand grid size-11 shrink-0 place-items-center rounded-full text-[14px] font-extrabold">
                {(requestMentorName.get(acceptedReq.mentor_id) ?? "A mentor")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-[1_1_200px]">
                <div className="text-mnt-ink text-[15px] font-bold">
                  {requestMentorName.get(acceptedReq.mentor_id) ?? "A mentor"}
                </div>
                <div className="text-mnt-ink-muted text-[13px]">
                  Your mentor
                </div>
              </div>
              <span className="bg-mnt-green/12 text-mnt-green inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold">
                <span className="bg-mnt-green size-1.5 rounded-full" />
                Accepted
              </span>
              <Link
                href={`/mentorship/mentors/${acceptedReq.mentor_id}`}
                className="border-mnt-line text-mnt-ink hover:bg-mnt-panel inline-flex h-10 items-center rounded-[10px] border px-3.5 text-[13px] font-semibold transition-colors"
              >
                Book a session
              </Link>
            </div>
          ) : requests.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
                >
                  <span className="text-mnt-ink text-[13px] font-semibold">
                    {requestMentorName.get(r.mentor_id) ?? "A mentor"}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[12px] font-bold capitalize " +
                      (r.status === "accepted"
                        ? "bg-mnt-green/12 text-mnt-green"
                        : r.status === "declined"
                          ? "bg-mnt-panel text-mnt-faint"
                          : "text-amber-600 [background:rgba(245,177,61,0.12)] dark:text-amber-400")
                    }
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mnt-ink-muted text-[13px] leading-relaxed">
              {isValidated
                ? "Browse verified mentors and request 1:1 guidance in your capability area."
                : "Validate your account to request a mentor."}
            </p>
          )}
        </section>

        {/* Recognition + passport */}
        <div className="flex flex-wrap gap-5">
          <section className="bg-mnt-panel border-mnt-line flex flex-[1_1_320px] flex-col gap-3 rounded-[18px] border p-[22px]">
            <h2 className="text-mnt-ink text-[17px] font-bold">Recognition</h2>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-mnt-brand text-[44px] leading-none font-extrabold tabular-nums">
                {score}
              </span>
              <span className="text-mnt-ink text-[15px] font-semibold">
                Expert Score
              </span>
            </div>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.key}
                    title={b.description}
                    className="bg-mnt-green/12 text-mnt-green rounded-full px-2.5 py-1 text-[12px] font-bold"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-2" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="border-mnt-line size-10 rounded-xl border border-dashed"
                    />
                  ))}
                </div>
                <p className="text-mnt-ink-muted text-[13px] leading-relaxed">
                  Badges appear as you complete Circles and earn approvals.
                </p>
              </>
            )}
          </section>

          <section className="bg-mnt-panel border-mnt-line flex flex-[1_1_320px] flex-col gap-3 rounded-[18px] border p-[22px]">
            <h2 className="text-mnt-ink text-[17px] font-bold">
              Capability passport
            </h2>
            {evidence.length === 0 ? (
              <div className="border-mnt-line bg-mnt-panel-2 flex flex-1 items-center gap-3.5 rounded-[14px] border border-dashed p-4">
                <span className="bg-mnt-brand/10 text-mnt-brand grid size-11 shrink-0 place-items-center rounded-xl">
                  <IdCard className="size-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-mnt-ink text-[14px] font-bold">
                    No verified capability yet
                  </div>
                  <div className="text-mnt-ink-muted text-[13px] leading-relaxed">
                    Evidence your mentor approves is recorded here as verified
                    capability.
                  </div>
                </div>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {evidence.map((e, i) => (
                  <li
                    key={i}
                    className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
                  >
                    <span className="text-mnt-ink text-[13px] font-semibold">
                      {e.title}
                    </span>
                    <span className="text-mnt-faint text-[11px] whitespace-nowrap">
                      {e.v_level != null ? `V${e.v_level}` : ""}
                      {e.capability_area ? ` · ${e.capability_area}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Become a mentor */}
        <section
          className="flex flex-col gap-4 rounded-[20px] p-6 text-white"
          style={{
            background:
              "linear-gradient(135deg, #110263 0%, #35007F 55%, #7530E6 100%)",
          }}
        >
          <div className="max-w-[640px]">
            <span className="text-[12px] font-bold tracking-[0.12em] text-[#D9CCFB] uppercase">
              Become a mentor
            </span>
            <h2 className="mt-1 text-[22px] font-extrabold">
              {hasPendingMentorApp
                ? "Your mentor application is in"
                : "Experienced in your field?"}
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#E4DBFC]">
              {hasPendingMentorApp
                ? "The ETEN Readiness Panel will review it. Once you are verified you can switch to the mentor workspace."
                : !isValidated
                  ? "Validate your ETEN membership first, then you can apply to become a mentor, no second account needed."
                  : "Apply to lead Circles and mentor others. The ETEN Readiness Panel reviews every mentor before verification."}
            </p>
          </div>

          {hasPendingMentorApp ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <Track label="Applied" state="done" />
              <Track label="Panel review" state="now" />
              <Track label="Verified mentor" state="todo" />
              <Link
                href="/mentorship/mentor"
                className="ml-auto inline-flex h-[42px] items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-[#110263]"
              >
                Mentor workspace <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : isValidated && mentorAreas.length > 0 ? (
            <ApplyMentorControl areas={mentorAreas} />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Track({
  label,
  state,
}: {
  label: string;
  state: "done" | "now" | "todo";
}) {
  const cls =
    state === "done"
      ? "bg-white/95 text-[#11703A]"
      : state === "now"
        ? "border border-white/45 bg-white/20 text-white"
        : "border border-dashed border-white/35 text-[#CFC6F5]";
  const dot =
    state === "done"
      ? "bg-[#16A34A]"
      : state === "now"
        ? "bg-[#F5B544]"
        : "bg-white/40";
  return (
    <span
      className={
        "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold " +
        cls
      }
    >
      <span className={"size-2 rounded-full " + dot} />
      {label}
    </span>
  );
}
