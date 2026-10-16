import type { NextRequest } from "next/server";

export const STATE_COOKIE = "yope_oauth_state";

export function googleIsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function callbackUrl(request?: NextRequest): string {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  const origin =
    request?.nextUrl.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${origin}/api/auth/google/callback`;
}