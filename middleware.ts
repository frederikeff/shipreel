import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

// When Auth0 is configured, this mounts /auth/login, /auth/logout, /auth/callback
// and refreshes the session. When it isn't, requests pass straight through so the
// app works with zero auth setup.
export async function middleware(req: NextRequest) {
  if (auth0) return auth0.middleware(req);
  return NextResponse.next();
}

export const config = {
  // Exclude static assets, generated media, and the eve agent transport routes
  // (eve, _eve_internal) so auth middleware never interferes with the agent.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|media|uploads|eve|_eve_internal|.*\\.).*)"],
};
