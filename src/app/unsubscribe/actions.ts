"use server";

import { redirect } from "next/navigation";
import { verifyUnsubscribe, recordUnsubscribe } from "@/lib/email-unsubscribe";

/** Confirm an unsubscribe from the page. The signed link is the proof. */
export async function confirmUnsubscribe(formData: FormData) {
  const email = String(formData.get("e") ?? "").toLowerCase();
  const token = String(formData.get("t") ?? "");
  const q = `e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`;
  if (!verifyUnsubscribe(email, token)) redirect(`/unsubscribe?${q}`);
  const saved = await recordUnsubscribe(email, "link");
  redirect(`/unsubscribe?${q}&${saved ? "done=1" : "failed=1"}`);
}
