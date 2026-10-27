import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";
import { mentorshipNotifText } from "@/lib/eten/mentorship-notifications";
import { NotificationsList, type NotifItem } from "./notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

type NotificationType =
  | "mention"
  | "comment"
  | "reaction"
  | "message"
  | "pod_activity"
  | "mentorship";

type Described = {
  who: string;
  what: string;
  href: string;
  iconKey: NotifItem["iconKey"];
  tag: string;
  tone: NotifItem["tone"];
};

function describe(
  type: NotificationType,
  actor: string,
  targetId: string | null,
  targetType: string | null,
): Described {
  switch (type) {
    case "comment":
      return {
        who: actor,
        what: "commented on your post",
        href: targetId ? `/feed/${targetId}` : "/feed",
        iconKey: "comment",
        tag: "Comment",
        tone: "blue",
      };
    case "reaction":
      return {
        who: actor,
        what: "reacted to your post",
        href: targetId ? `/feed/${targetId}` : "/feed",
        iconKey: "reaction",
        tag: "Reaction",
        tone: "accent",
      };
    case "message":
      return {
        who: actor,
        what: "sent you a message",
        href: targetId ? `/messages/${targetId}` : "/messages",
        iconKey: "message",
        tag: "Message",
        tone: "blue",
      };
    case "mention":
      return {
        who: actor,
        what: "mentioned you",
        href: targetId ? `/feed/${targetId}` : "/feed",
        iconKey: "mention",
        tag: "Mention",
        tone: "accent",
      };
    case "mentorship":
      return {
        who: "",
        what: mentorshipNotifText(targetType, actor),
        href: targetId ? `/circles/${targetId}` : "/circles",
        iconKey: "mentorship",
        tag: "Mentorship",
        tone: "accent",
      };
    default:
      return {
        who: actor,
        what: "posted in a pod you follow",
        href: "/pods",
        iconKey: "pod",
        tag: "Pod",
        tone: "amber",
      };
  }
}

const WEEK_MS = 7 * 86_400_000;

export default async function NotificationsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, actor_id, target_type, target_id, is_read, created_at")
    .eq("recipient_id", member.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = rows ?? [];
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
    (actorRows ?? []).map((a) => [a.member_id, a.full_name]),
  );

  const now = new Date().getTime();
  const items: NotifItem[] = notifications.map((n) => {
    const actor = n.actor_id
      ? (nameById.get(n.actor_id) ?? "A member")
      : "Someone";
    const d = describe(
      n.type as NotificationType,
      actor,
      n.target_id,
      n.target_type,
    );
    return {
      id: n.id,
      who: d.who,
      what: d.what,
      href: d.href,
      iconKey: d.iconKey,
      tag: d.tag,
      tone: d.tone,
      when: timeAgo(n.created_at),
      isRead: n.is_read,
      group: now - Date.parse(n.created_at) <= WEEK_MS ? "recent" : "earlier",
    };
  });

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 md:px-8 md:py-9">
      {items.length === 0 ? (
        <>
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Notifications
          </h1>
          <div className="bg-eten-panel border-eten-line text-eten-ink-muted mt-6 flex flex-col items-center gap-3 rounded-[18px] border p-12 text-center">
            <span className="bg-eten-accent-soft text-eten-accent grid size-13 place-items-center rounded-2xl">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              </svg>
            </span>
            <p className="text-sm">
              You&apos;re all caught up. Activity on your posts, pods and
              mentorship shows up here.
            </p>
          </div>
        </>
      ) : (
        <NotificationsList initial={items} />
      )}
    </div>
  );
}
