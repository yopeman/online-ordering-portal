import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { clearSessionCookie, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";

async function handleLogout(request: NextRequest) {
  await clearSessionCookie();
  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore revalidate errors if any
  }

  const response = NextResponse.redirect(new URL("/login", request.nextUrl.origin), {
    status: 303,
  });

  // Explicitly set expired cookies in the redirect response
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete(SESSION_COOKIE);

  // Prevent caching of authenticated pages after logout
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Clear-Site-Data", '"cache"');

  return response;
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
