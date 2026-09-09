import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // Conversations I'm in (RLS scopes participants to my conversations).
  const { data: myParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("member_id", member.id);

  const convIds = (myParts ?? []).map((p) => p.conversation_id);
  const lastReadByConv = new Map(
    (myParts ?? []).map((p) => [p.conversation_id, p.last_read_at]),
  );

  if (convIds.length === 0) {
    return <Shell>{null}</Shell>;
  }

  const [{ data: partRows }, { data: msgRows }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, member_id")
      .in("conversation_id", convIds),
    supabase
      .from("messages")
      .select("conversation_id, sender_id, body, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
  ]);

  // The "other" member per (1:1) conversation.
  const otherByConv = new Map<string, string>();
  for (const p of partRows ?? []) {
    if (p.member_id !== member.id && !otherByConv.has(p.conversation_id)) {
      otherByConv.set(p.conversation_id, p.member_id);
    }
  }

  // Latest message per conversation (rows are newest-first).
  const lastMsgByConv = new Map<
    string,
    { body: string; created_at: string; sender_id: string }
  >();
  for (const m of msgRows ?? []) {
    if (!lastMsgByConv.has(m.conversation_id)) {
      lastMsgByConv.set(m.conversation_id, {
        body: m.body,
        created_at: m.created_at,
        sender_id: m.sender_id,
      });
    }
  }

  const otherIds = [...new Set([...otherByConv.values()])];
  const { data: nameRows } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", otherIds)
    : { data: [] };
  const nameById = new Map(
    (nameRows ?? []).map((n) => [n.member_id, n.full_name]),
  );

  // Order conversations by latest activity.
  const items = convIds
    .map((id) => {
      const otherId = otherByConv.get(id) ?? null;
      const last = lastMsgByConv.get(id) ?? null;
      const lastRead = lastReadByConv.get(id) ?? null;
      const unread = Boolean(
        last &&
        last.sender_id !== member.id &&
        (!lastRead || last.created_at > lastRead),
      );
      return {
        id,
        otherId,
        otherName: otherId
          ? (nameById.get(otherId) ?? "A member")
          : "Conversation",
        last,
        unread,
      };
    })
    .sort((a, b) =>
      (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""),
    );

  return (
    <Shell>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="bg-eten-panel border-eten-line hover:bg-eten-hover flex items-center gap-3 rounded-xl border p-4 transition-colors"
            >
              <span className="from-eten-accent grid size-11 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br to-[#3257b8] font-bold text-white">
                {c.otherName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-eten-ink truncate font-semibold">
                    {c.otherName}
                  </span>
                  {c.last && (
                    <span className="text-eten-faint shrink-0 text-xs">
                      {timeAgo(c.last.created_at)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={
                      c.unread
                        ? "text-eten-ink truncate text-sm font-medium"
                        : "text-eten-faint truncate text-sm"
                    }
                  >
                    {c.last
                      ? `${c.last.sender_id === member.id ? "You: " : ""}${c.last.body}`
                      : "No messages yet"}
                  </span>
                  {c.unread && (
                    <span className="bg-eten-accent size-2 shrink-0 rounded-full" />
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6">
      <header className="mb-6 hidden md:block">
        <h1 className="font-display text-eten-ink text-xl font-semibold">
          Messages
        </h1>
      </header>

      {children ?? (
        <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
          <MessagesSquare className="text-eten-faint/50 size-9" />
          <p className="text-sm">
            No conversations yet. Open a member&apos;s profile and choose
            “Message” to start one.
          </p>
        </div>
      )}
    </div>
  );
}
