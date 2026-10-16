import { NextResponse, type NextRequest } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { devAccountsEnabled } from "@/lib/dev-accounts";

/**
 * Development only: signs in as an existing account so the dashboard can be
 * exercised without Google credentials. Returns 404 in production or as soon
 * as Google OAuth is configured.
 */
export async function POST(request: NextRequest) {
  if (!devAccountsEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const formData = await request.formData();
  const userId = formData.get("userId");

  if (typeof userId !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const nextParam = request.nextUrl.searchParams.get("next");
  const next = nextParam?.startsWith("/") ? nextParam : "/businesses";

  await connectDB();
  const user = await User.findOne({ _id: userId, status: "active" }).lean();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  await setSessionCookie({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  });

  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}