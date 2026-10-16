import { NextResponse, type NextRequest } from "next/server";

import { STATE_COOKIE, callbackUrl, googleIsConfigured } from "@/lib/google-auth";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/** Starts the Google OAuth flow and stores a CSRF `state` cookie. */
export function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleIsConfigured() || !clientId) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", request.nextUrl.origin),
    );
  }

  const next = request.nextUrl.searchParams.get("next") ?? "/businesses";
  const state = crypto.randomUUID();

  const authorizeUrl = new URL(AUTH_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl(request));
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("access_type", "offline");
  authorizeUrl.searchParams.set("prompt", "select_account");
  authorizeUrl.searchParams.set("state", `${state}.${encodeURIComponent(next)}`);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}