import { NextResponse, type NextRequest } from "next/server";

import { findOrCreateTelegramUser, verifyTelegramWidgetAuth } from "@/lib/telegram-auth";

/**
 * Handles the redirect from Telegram Login Widget (data-auth-url).
 * Verifies HMAC-SHA256 signature, creates/updates the user, sets session cookie.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  const { valid, user, reason } = verifyTelegramWidgetAuth(params);
  if (!valid || !user) {
    console.error("[Telegram Auth] Widget verification failed:", reason);
    return fail("telegram_failed");
  }

  let token: string | undefined;
  try {
    const authResult = await findOrCreateTelegramUser(user);
    token = authResult.token;
  } catch (err: unknown) {
    console.error("[Telegram Auth] Failed to establish session:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg === "account_inactive") {
      return fail("account_inactive");
    }
    return fail("telegram_failed");
  }

  const next = searchParams.get("next");
  const target = next && next.startsWith("/") ? next : "/businesses";
  const redirectResponse = NextResponse.redirect(new URL(target, origin));
  if (token) {
    redirectResponse.cookies.set("yope_session", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return redirectResponse;
}
