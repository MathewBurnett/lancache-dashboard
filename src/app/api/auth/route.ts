import { NextResponse } from "next/server";
import { isAuthRequired, checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Tells the UI whether admin actions need a key. */
export function GET() {
  return NextResponse.json({ authRequired: isAuthRequired() });
}

/** Validate a provided admin key (used by the UI unlock prompt). */
export async function POST(req: Request) {
  if (!isAuthRequired()) {
    return NextResponse.json({ ok: true, authRequired: false });
  }
  const ok = checkAdmin(req);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
