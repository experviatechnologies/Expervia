import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "Notifications" };

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

type Notif = {
  id: string;
  type: string;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
};

function render(n: Notif, actor: string): { text: string; href: string } {
  const circle =
    n.target_type === "circle" && n.target_id
      ? `/mentorship/circles/${n.target_id}`
      : "/mentorship/dashboard";
  switch (n.type) {
    case "mentorship":
      return { text: `${actor} sent a mentorship update`, href: circle };
    default:
      return {
        text: `${actor} sent you an update`,
        href: "/mentorship/dashboard",
      };
  }
}

export default async function MentorshipNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, actor_id, target_type, target_id, is_read, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const notifications = (rows ?? []) as Notif[];

  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean)),
  ] as string[];
  const { data: actorRows } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", actorIds)
    : { data: [] };
  const nameById = new Map(
    (actorRows ?? []).map((a) => [a.member_id, a.full_name ?? "Someone"]),
  );

  // Mark unread as read on view.
  if (notifications.some((n) => !n.is_read)) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
  }

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <Link
        href="/mentorship/dashboard"
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back
      </Link>
      <h1 className="font-display mt-3 text-2xl font-extrabold">
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className="border-mnt-line text-mnt-faint mt-6 rounded-2xl border border-dashed p-10 text-center text-[13px]">
          Nothing yet. Updates about your Circle show up here.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {notifications.map((n) => {
            const { text, href } = render(
              n,
              nameById.get(n.actor_id ?? "") ?? "Someone",
            );
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={
                    "bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition " +
                    (n.is_read ? "" : "border-mnt-brand/40")
                  }
                >
                  <span className="text-[13.5px]">{text}</span>
                  <span className="text-mnt-faint text-[11.5px] whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
