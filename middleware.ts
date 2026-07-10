import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight demo auth gate: unauthenticated users are sent to /login.
 * A `nettrace_auth` cookie is set on sign-in and cleared on sign-out.
 * (Demo only — not a real security boundary.)
 */
export function middleware(req: NextRequest) {
  const authed = req.cookies.has("nettrace_auth");
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL("/executive", req.url));
    return NextResponse.next();
  }
  if (!authed) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Gate everything except API routes, Next internals and static files (paths with a dot).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
