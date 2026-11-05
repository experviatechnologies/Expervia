import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encryption for calendar OAuth tokens at rest (AES-256-GCM).
 *
 * CALENDAR_TOKEN_KEY is a 32-byte key, base64 encoded. Create one with
 *   openssl rand -base64 32
 * Stored form: "v1.<iv>.<tag>.<ciphertext>" (base64url parts). Changing the
 * key means every member reconnects their calendar.
 */

function key(): Buffer {
  const raw = process.env.CALENDAR_TOKEN_KEY;
  if (!raw) throw new Error("CALENDAR_TOKEN_KEY is not set.");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) {
    throw new Error("CALENDAR_TOKEN_KEY must be 32 bytes, base64 encoded.");
  }
  return k;
}

export function tokenKeyConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv, tag, body]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function decryptToken(stored: string): string {
  const [v, iv, tag, body] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("Bad token format.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
