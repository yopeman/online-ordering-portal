import { NextResponse, type NextRequest } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

import { STATE_COOKIE, callbackUrl } from "@/lib/google-auth";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

async function fetchGoogleProfile(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokens.access_token) return null;

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    },
  );

  if (!profileResponse.ok) return null;
  return (await profileResponse.json()) as GoogleProfile;
}

/** Handles the Google redirect: verifies state, upserts the user, signs in. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;
  const origin = request.nextUrl.origin;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  if (!code || !state) return fail("google_failed");
  if (!storedState || !state.startsWith(`${storedState}.`)) return fail("state_mismatch");

  const next = decodeURIComponent(state.slice(storedState.length + 1));
  const profile = await fetchGoogleProfile(code, callbackUrl(request));
  if (!profile?.email) return fail("google_failed");

  await connectDB();

  // First account to sign in becomes the platform admin so the portal is
  // usable right after a fresh install.
  const isFirstUser = (await User.estimatedDocumentCount()) === 0;

  const user = await User.findOneAndUpdate(
    { providerId: profile.sub, provider: "google" },
    {
      $set: {
        email: profile.email.toLowerCase(),
        name: profile.name ?? profile.email.split("@")[0],
        image: profile.picture ?? "",
        // 🚀 Cleaned: 'role' removed from here completely to prevent Mongo conflict errors
      },
      $setOnInsert: {
        provider: "google",
        providerId: profile.sub,
        status: "active",
        role: isFirstUser ? "admin" : "business_owner", // 🚀 Works perfectly on creation
        maxBusinesses: isFirstUser ? 1000 : 3,
        maxCatalogs: isFirstUser ? 1000 : 50,
      },
    },
    { 
      upsert: true, 
      returnDocument: 'after', // 🚀 Fixes the Mongoose deprecation warning!
      setDefaultsOnInsert: true 
    },
  ).lean();

  if (!user) return fail("google_failed");
  if (user.status !== "active") return fail("account_inactive");

  await setSessionCookie({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  });

  const response = NextResponse.redirect(
    new URL(next.startsWith("/") ? next : "/businesses", origin),
  );
  response.cookies.delete(STATE_COOKIE);

  return response;
}