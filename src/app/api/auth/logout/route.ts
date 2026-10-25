import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { SESSION_COOKIE } from "@/lib/auth/session";

async function handleLogout() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore revalidate errors if any
  }

  const expiredStamp = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";

  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/",
      "Clear-Site-Data": '"cookies", "cache", "storage"',
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  // Explicitly append all variations of Set-Cookie deletion headers
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; ${expiredStamp}; HttpOnly; Secure; SameSite=None; Partitioned`
  );
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; ${expiredStamp}; HttpOnly; Secure; SameSite=None`
  );
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; ${expiredStamp}; HttpOnly; Secure; SameSite=Lax`
  );
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; ${expiredStamp}; HttpOnly; Path=/`
  );
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; ${expiredStamp}`
  );

  return response;
}

export async function GET() {
  return handleLogout();
}

export async function POST() {
  return handleLogout();
}
