import { NextResponse, type NextRequest } from "next/server";

import { findOrCreateTelegramUser, verifyTelegramWebAppData } from "@/lib/telegram-auth";

/**
 * Handles Telegram Mini App (Web App) authentication.
 * Receives `initData` query string directly from window.Telegram.WebApp.initData,
 * verifies HMAC signature with "WebAppData" secret key, creates user, and sets session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.initData !== "string") {
      return NextResponse.json({ error: "Missing initData parameter" }, { status: 400 });
    }

    const { valid, user, reason } = verifyTelegramWebAppData(body.initData);
    if (!valid || !user) {
      console.error("[Telegram Auth] Mini App verification failed:", reason);
      return NextResponse.json(
        { error: "Invalid Telegram WebApp signature", reason },
        { status: 401 },
      );
    }

    const { token } = await findOrCreateTelegramUser(user);

    const next =
      typeof body.next === "string" && body.next.startsWith("/")
        ? body.next
        : "/businesses";

    const response = NextResponse.json({ ok: true, token, redirectUrl: next });
    response.cookies.set("yope_session", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    console.error("[Telegram Auth] Mini App error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = msg === "account_inactive" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
