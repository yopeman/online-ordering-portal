import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { connectDB } from "@/lib/db";
import { toUserDTO, type UserDTO } from "@/lib/models/user";
import { User } from "@/lib/models/user";

export const SESSION_COOKIE = "yope_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  [key: string]: unknown;
  sub: string;
  email: string;
  name: string;
  role: string;
  image: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "yope-order-development-secret";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "business_owner"),
      image: String(payload.image ?? ""),
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  partitioned: true,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function setSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}

/** Reads + verifies the session cookie. `null` when signed out. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

/**
 * Loads the signed in user from the database so role/status changes take
 * effect immediately instead of waiting for the JWT to expire.
 */
export const getCurrentUser = cache(async (): Promise<UserDTO | null> => {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.sub).lean();
  if (!user || user.status !== "active") return null;

  return toUserDTO(user);
});

export const isAdmin = (user: UserDTO | null): boolean => user?.role === "admin";