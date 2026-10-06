import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ClassRoom } from "./class-room";

export const metadata = { title: "Live class" };

export default async function LiveClassPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  // RLS (can_see_circle) only returns the row to the mentor, members or ops,
  // so a session that comes back means the viewer may attend it.
  const { data: session } = await supabase
    .from("circle_sessions")
    .select("id, circle_id, title, starts_at, duration_minutes")
    .eq("id", sessionId)
    .eq("circle_id", id)
    .maybeSingle();

  // Only scheduled classes (with a start time) have a live room.
  if (!session || !session.starts_at) notFound();

  // Role + 1:1 context: 1:1 sessions are mentor-ended (no hard cut) and a mentee
  // in a 1:1 may be able to pay to extend.
  const { data: circle } = await supabase
    .from("mentorship_circles")
    .select("mentor_id, format")
    .eq("id", id)
    .maybeSingle();
  const isMentor = circle?.mentor_id === user.id;
  const isOneToOne = circle?.format === "one_to_one";

  let extension: { amount: number; currency: string; minutes: number } | null =
    null;
  if (isOneToOne && !isMentor && circle) {
    const [{ data: pricing }, { data: activeExt }] = await Promise.all([
      supabase
        .from("mentor_pricing")
        .select("extension_enabled, extension_amount, currency")
        .eq("member_id", circle.mentor_id)
        .maybeSingle(),
      supabase
        .from("session_extensions")
        .select("id")
        .eq("session_id", session.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);
    if (pricing?.extension_enabled && pricing.extension_amount && !activeExt) {
      extension = {
        amount: pricing.extension_amount,
        currency: pricing.currency,
        minutes: 30,
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ClassRoom
        sessionId={session.id}
        title={session.title ?? "Live class"}
        startsAt={session.starts_at}
        durationMinutes={session.duration_minutes ?? 60}
        circleHref={`/mentorship/circles/${id}`}
        isMentor={isMentor}
        hardCut={!isOneToOne}
        extension={extension}
      />
    </div>
  );
}
