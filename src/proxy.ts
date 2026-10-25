import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "yope_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Middleware to support seamless authentication in iframe/WebView environments
 * like Telegram Mini Apps where cross-site/third-party cookies may be delayed or partitioned.
 *
 * If `tg_session` is present in the URL query parameters, it injects the cookie
 * into the incoming request headers (so React Server Components immediately see the user)
 * and attaches the partitioned cookie to the outgoing response.
 */
export function proxy(request: NextRequest) {
  const tgSession = request.nextUrl.searchParams.get("tg_session");

  if (tgSession && tgSession.trim().length > 0) {
    const existingCookie = request.cookies.get(SESSION_COOKIE)?.value;
    const requestHeaders = new Headers(request.headers);

    // Inject into request headers so Next.js server components can read it immediately
    const cookieHeader = existingCookie
      ? `${SESSION_COOKIE}=${tgSession}; ${request.headers.get("cookie") ?? ""}`
      : `${SESSION_COOKIE}=${tgSession}`;
    requestHeaders.set("cookie", cookieHeader);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set(SESSION_COOKIE, tgSession, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.png|favicon.ico).*)"],
};
