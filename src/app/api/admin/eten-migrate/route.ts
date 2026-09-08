import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { runMigration, type MigrationMode } from "@/lib/eten/migration";

/** Typed confirmation the UI must send to trigger a real mass invite. */
const SEND_ALL_CONFIRM = "SEND-ALL";

/**
 * Runs the ETEN existing-member migration. Ops-only, POST.
 *
 * Body: { mode: "dry-run" | "test" | "send", testEmails?: string[], confirm?: string }
 *   - dry-run : read-only report of who would be invited (default, safe).
 *   - test    : provision + invite ONLY the given testEmails.
 *   - send     : provision + invite everyone eligible, in one batch — requires
 *                confirm === "SEND-ALL" so it can't fire by accident.
 */
export async function POST(request: NextRequest) {
  // Defence-in-depth: proxy gates /admin, but this route is a direct POST.
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOperations())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    mode?: string;
    testEmails?: unknown;
    confirm?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mode = body.mode as MigrationMode;
  if (mode !== "dry-run" && mode !== "test" && mode !== "send") {
    return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
  }

  const testEmails = Array.isArray(body.testEmails)
    ? body.testEmails.filter((e): e is string => typeof e === "string")
    : [];

  if (mode === "test" && testEmails.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one test email." },
      { status: 400 },
    );
  }
  if (mode === "send" && body.confirm !== SEND_ALL_CONFIRM) {
    return NextResponse.json(
      { error: `Mass send requires confirm = "${SEND_ALL_CONFIRM}".` },
      { status: 400 },
    );
  }

  if (!process.env.CONTACT_FROM_EMAIL) {
    return NextResponse.json(
      { error: "CONTACT_FROM_EMAIL is not configured." },
      { status: 500 },
    );
  }

  try {
    const report = await runMigration(
      getSupabaseAdmin(),
      getResendClient(),
      request.nextUrl.origin,
      process.env.CONTACT_FROM_EMAIL,
      { mode, testEmails },
    );
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Migration failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
