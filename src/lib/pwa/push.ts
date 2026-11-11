import "server-only";
import { after } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase";
import { siteConfig } from "@/config/site";
import {
  mentorshipNotifHref,
  mentorshipNotifText,
} from "@/lib/eten/mentorship-notifications";
import { presalesNotifHref, presalesNotifText } from "@/lib/tracker/events";

/**
 * Push notifications to members' phones and computers (PWA phase 4).
 *
 * Every in-app notification is also pushed to the recipient's devices, unless
 * they switched that kind off. Pushes go out after the response (next/server
 * `after`), so they never slow down the action that caused them. Needs
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (and optionally
 * VAPID_SUBJECT); without them nothing is sent.
 *
 * Message text never includes private content (a message's words, amounts):
 * pushes show on lock screens.
 */

/** Kinds a member can switch off, as stored in push_preferences.muted. */
export const PUSH_CATEGORIES = [
  "message",
  "mentorship",
  "session_reminder",
  "mention",
  "comment",
  "reaction",
  "presales",
  "pod_activity",
] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];

/** Off unless the member turns them on: frequent and low-value. */
export const DEFAULT_MUTED: PushCategory[] = ["reaction", "pod_activity"];

export type PushMessage = {
  title: string;
  body: string;
  /** Same-site path opened when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other on the device. */
  tag?: string;
};

let configured: boolean | null = null;
function configure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || siteConfig.url,
    pub,
    priv,
  );
  configured = true;
  return true;
}

/** Members (of those given) who switched this kind of push off. */
async function mutedFor(
  memberIds: string[],
  category: PushCategory,
): Promise<Set<string>> {
  const { data } = await getSupabaseAdmin()
    .from("push_preferences")
    .select("member_id, muted")
    .in("member_id", memberIds);
  const rows = new Map(
    (data ?? []).map((r) => [r.member_id as string, r.muted as string[]]),
  );
  return new Set(
    memberIds.filter((id) =>
      (rows.get(id) ?? DEFAULT_MUTED).includes(category),
    ),
  );
}

/**
 * Send one message to every device of these members. Skips members who muted
 * the category, removes devices the browser reports gone. Never throws.
 * Returns how many devices it reached.
 */
export async function sendPush(
  memberIds: (string | null | undefined)[],
  category: PushCategory | null,
  message: PushMessage,
): Promise<number> {
  try {
    if (!configure()) return 0;
    let ids = [...new Set(memberIds.filter(Boolean))] as string[];
    if (!ids.length) return 0;
    if (category) {
      const muted = await mutedFor(ids, category);
      ids = ids.filter((id) => !muted.has(id));
      if (!ids.length) return 0;
    }

    const admin = getSupabaseAdmin();
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("member_id", ids);
    if (error || !subs?.length) return 0;

    const payload = JSON.stringify(message);
    const gone: string[] = [];
    const reached: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 24 * 60 * 60, urgency: "normal" },
          );
          reached.push(s.id);
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(s.id);
          else console.error("push failed", status, (err as Error).message);
        }
      }),
    );
    if (gone.length) {
      await admin.from("push_subscriptions").delete().in("id", gone);
    }
    if (reached.length) {
      await admin
        .from("push_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .in("id", reached);
    }
    return reached.length;
  } catch (err) {
    console.error("sendPush failed", err);
    return 0;
  }
}

/** Run push work after the response; fall back to now outside a request. */
export function pushLater(work: () => Promise<unknown>): void {
  try {
    after(work);
  } catch {
    void work();
  }
}

async function actorName(actorId: string | null): Promise<string> {
  if (!actorId) return "Someone";
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("full_name")
    .eq("member_id", actorId)
    .maybeSingle();
  return (data?.full_name as string | null)?.trim() || "Someone";
}

/** The push for an in-app notification: same wording and link as the app. */
export async function pushForNotification(n: {
  recipientIds: string[];
  actorId: string | null;
  type: string;
  targetType: string | null;
  targetId: string | null;
}): Promise<void> {
  const who = await actorName(n.actorId);
  const id = n.targetId;
  let category: PushCategory;
  let message: PushMessage;
  switch (n.type) {
    case "message":
      category = "message";
      message = {
        title: "New message",
        body: `${who} sent you a message`,
        url: id ? `/messages/${id}` : "/messages",
      };
      break;
    case "comment":
      category = "comment";
      message = {
        title: "New comment",
        body: `${who} commented on your post`,
        url: id ? `/feed/${id}` : "/feed",
      };
      break;
    case "reaction":
      category = "reaction";
      message = {
        title: "New reaction",
        body: `${who} reacted to your post`,
        url: id ? `/feed/${id}` : "/feed",
      };
      break;
    case "mention":
      category = "mention";
      message = {
        title: "You were mentioned",
        body: `${who} mentioned you`,
        url: id ? `/feed/${id}` : "/feed",
      };
      break;
    case "mentorship":
      category = "mentorship";
      message = {
        title: "ETEN Mentorship",
        body: mentorshipNotifText(n.targetType, who),
        url: mentorshipNotifHref(n.targetType, id),
      };
      break;
    case "presales":
      category = "presales";
      message = {
        title: "Presales",
        body: presalesNotifText(n.targetType, n.actorId ? who : "ETEN"),
        url: presalesNotifHref(id, n.targetType),
      };
      break;
    default:
      category = "pod_activity";
      message = {
        title: "Pod activity",
        body: `${who} posted in a pod you follow`,
        url: "/pods",
      };
  }
  message.tag = `${n.type}:${n.targetType ?? ""}:${id ?? ""}`;
  await sendPush(n.recipientIds, category, message);
}
