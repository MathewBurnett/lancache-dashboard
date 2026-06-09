import crypto from "crypto";

/** The configured admin key, or null if admin protection is disabled. */
export function adminKey(): string | null {
  const k = process.env.ADMIN_API_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

/** Whether mutating endpoints require an admin key. */
export function isAuthRequired(): boolean {
  return adminKey() !== null;
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/** Extract the provided key from headers (x-api-key or Authorization: Bearer). */
function providedKey(req: Request): string | null {
  const direct = req.headers.get("x-api-key");
  if (direct) return direct.trim();
  const auth = req.headers.get("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, "").trim();
  return null;
}

/**
 * Returns true if the request is allowed to perform admin/mutating actions.
 * Open (true) when no key is configured; otherwise requires a matching key.
 */
export function checkAdmin(req: Request): boolean {
  const key = adminKey();
  if (!key) return true; // open mode
  const provided = providedKey(req);
  return provided !== null && constantTimeEqual(provided, key);
}
