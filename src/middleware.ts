import { NextRequest, NextResponse } from "next/server";

// Optional full-site HTTP Basic Auth. Enabled only when both env vars are set.
const USER = process.env.DASHBOARD_USER;
const PASS = process.env.DASHBOARD_PASSWORD;

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="LanCache Dashboard", charset="UTF-8"' },
  });
}

export function middleware(req: NextRequest) {
  // Full-site basic auth (opt-in)
  if (USER && PASS) {
    const header = req.headers.get("authorization") || "";
    const [scheme, encoded] = header.split(" ");
    if (scheme !== "Basic" || !encoded) return unauthorized();
    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch {
      return unauthorized();
    }
    const idx = decoded.indexOf(":");
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    if (user !== USER || pass !== PASS) return unauthorized();
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Apply to everything except Next internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
