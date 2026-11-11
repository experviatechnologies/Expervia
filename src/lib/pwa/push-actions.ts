"use server";

import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  DEFAULT_MUTED,
  PUSH_CATEGORIES,
  sendPush,
  type PushCategory,
} from "@/lib/pwa/push";
import type { AppPlatform } from "@/lib/pwa/actions";

type Result = { ok: true } | { error: string };
const PLATFORMS: AppPlatform[] = ["android", "ios", "desktop", "other"];

/** Save this device's push subscription for the signed-in member. */
export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: AppPlatform;
  userAgent?: string;
}): Promise<Result> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  let url: URL;
  try {
    url = new URL(input.endpoint);
  } catch {
    return { error: "That device can't receive notifications." };
  }
  if (url.protocol !== "https:" || !input.p256dh || !input.auth) {
    return { error: "That device can't receive notifications." };
  }

  // The same device may have been subscribed by someone else who used it
  // before: the endpoint is unique, so it moves to whoever is signed in now.
  const { error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .upsert(
      {
        member_id: me.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        platform: PLATFORMS.includes(input.platform) ? input.platform : "other",
        user_agent: input.userAgent?.slice(0, 300) ?? null,
      },
      { onConflict: "endpoint" },
    );
  if (error) {
    console.error("savePushSubscription failed", error.message);
    return { error: "Couldn't turn on notifications. Please try again." };
  }
  return { ok: true };
}

/** Forget this device (the member turned notifications off on it). */
export async function removePushSubscription(
  endpoint: string,
): Promise<Result> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  await getSupabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("member_id", me.id)
    .eq("endpoint", endpoint);
  return { ok: true };
}

/** The kinds of push the signed-in member has switched off. */
export async function getMutedPush(): Promise<PushCategory[]> {
  const me = await getCurrentMember();
  if (!me) return DEFAULT_MUTED;
  const { data } = await getSupabaseAdmin()
    .from("push_preferences")
    .select("muted")
    .eq("member_id", me.id)
    .maybeSingle();
  return ((data?.muted as PushCategory[] | undefined) ?? DEFAULT_MUTED).filter(
    (c) => PUSH_CATEGORIES.includes(c),
  );
}

/** Switch one kind of push on or off for the signed-in member. */
export async function setPushCategory(input: {
  category: PushCategory;
  enabled: boolean;
}): Promise<Result> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (!PUSH_CATEGORIES.includes(input.category)) {
    return { error: "Unknown notification type." };
  }
  const current = new Set(await getMutedPush());
  if (input.enabled) current.delete(input.category);
  else current.add(input.category);
  const { error } = await getSupabaseAdmin()
    .from("push_preferences")
    .upsert(
      {
        member_id: me.id,
        muted: [...current],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_id" },
    );
  if (error) return { error: "Couldn't save that. Please try again." };
  return { ok: true };
}

/** Send a test notification to the signed-in member's devices. */
export async function sendTestPush(): Promise<
  { ok: true; devices: number } | { error: string }
> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  const devices = await sendPush([me.id], null, {
    title: "Notifications are on",
    body: "This is how ETEN will let you know about sessions, requests and messages.",
    url: "/launch",
    tag: "test",
  });
  if (!devices) {
    return {
      error:
        "We couldn't reach this device. Turn notifications off and on again, then retry.",
    };
  }
  return { ok: true, devices };
}
