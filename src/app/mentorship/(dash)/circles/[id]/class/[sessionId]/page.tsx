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

  return (
    <div className="mx-auto max-w-4xl">
      <ClassRoom
        sessionId={session.id}
        title={session.title ?? "Live class"}
        startsAt={session.starts_at}
        durationMinutes={session.duration_minutes ?? 60}
        circleHref={`/mentorship/circles/${id}`}
      />
    </div>
  );
}
