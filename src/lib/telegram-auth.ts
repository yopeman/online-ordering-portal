import "server-only";

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User, toUserDTO, type UserDTO } from "@/lib/models/user";

export interface TelegramUser {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number | string;
}

/** Returns the bot token configured in environment variables. */
export function getTelegramBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

/** Returns the bot username without a leading '@'. */
export function getTelegramBotUsername(): string {
  const raw =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    process.env.TELEGRAM_BOT_USERNAME ||
    "";
  return raw.trim().replace(/^@/, "");
}

/** Checks whether both bot token and username are configured. */
export function telegramIsConfigured(): boolean {
  return Boolean(getTelegramBotToken() && getTelegramBotUsername());
}

/**
 * Returns the Telegram data-auth-url callback URL.
 * Uses NEXT_PUBLIC_APP_URL from environment as primary base.
 */
export function getTelegramCallbackUrl(request?: NextRequest, next?: string): string {
  const explicitCallback = process.env.TELEGRAM_CALLBACK_URL?.trim();
  let base: string;

  if (explicitCallback) {
    base = explicitCallback;
  } else {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const origin = appUrl || request?.nextUrl.origin || "http://localhost:3000";
    base = `${origin.replace(/\/+$/, "")}/api/auth/telegram/callback`;
  }

  const url = new URL(base);
  if (next && next.startsWith("/")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

/**
 * Validates authentication data received from the Telegram Login Widget.
 *
 * Algorithm per Telegram documentation:
 * 1. Extract and remove the `hash` parameter.
 * 2. Filter for widget parameters and sort keys alphabetically.
 * 3. Create a data_check_string with "key=value" pairs separated by newlines.
 * 4. Create secret_key = SHA256(bot_token).
 * 5. Compare HMAC-SHA256(data_check_string, secret_key) against received hash using timing-safe comparison.
 */
export function verifyTelegramWidgetAuth(
  params: Record<string, string | number | undefined | null>,
): { valid: boolean; user?: TelegramUser; reason?: string } {
  const botToken = getTelegramBotToken();
  if (!botToken) {
    return { valid: false, reason: "bot_token_missing" };
  }

  const receivedHash = typeof params.hash === "string" ? params.hash.trim().toLowerCase() : "";
  if (!receivedHash) {
    return { valid: false, reason: "hash_missing" };
  }

  const authDate = Number(params.auth_date);
  if (!authDate || Number.isNaN(authDate)) {
    return { valid: false, reason: "invalid_auth_date" };
  }

  // Prevent replay attacks (allow up to 24 hours)
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400 || authDate - now > 300) {
    return { valid: false, reason: "auth_date_expired" };
  }

  // Telegram Login Widget only signs these standard fields
  const allowedKeys = [
    "auth_date",
    "first_name",
    "id",
    "last_name",
    "photo_url",
    "username",
  ] as const;

  const checkPairs: string[] = [];
  for (const key of allowedKeys.slice().sort()) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      checkPairs.push(`${key}=${val}`);
    }
  }

  const dataCheckString = checkPairs.join("\n");
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex")
    .toLowerCase();

  const calcBuf = Buffer.from(calculatedHash, "hex");
  const recBuf = Buffer.from(receivedHash, "hex");

  if (calcBuf.length !== recBuf.length || !crypto.timingSafeEqual(calcBuf, recBuf)) {
    return { valid: false, reason: "hash_mismatch" };
  }

  const user: TelegramUser = {
    id: params.id!,
    first_name: String(params.first_name || ""),
    last_name: params.last_name ? String(params.last_name) : undefined,
    username: params.username ? String(params.username) : undefined,
    photo_url: params.photo_url ? String(params.photo_url) : undefined,
    auth_date: authDate,
  };

  return { valid: true, user };
}

/**
 * Validates initData string received from Telegram Mini Apps.
 *
 * Algorithm per Telegram Web App documentation:
 * 1. Parse raw query string.
 * 2. Extract and remove the `hash` parameter.
 * 3. Sort all remaining parameters alphabetically and join with newlines.
 * 4. Create secret_key = HMAC-SHA256("WebAppData", bot_token).
 * 5. Compare HMAC-SHA256(data_check_string, secret_key) against received hash using timing-safe comparison.
 */
export function verifyTelegramWebAppData(
  initDataRaw: string,
): { valid: boolean; user?: TelegramUser; reason?: string } {
  const botToken = getTelegramBotToken();
  if (!botToken) {
    return { valid: false, reason: "bot_token_missing" };
  }

  if (!initDataRaw || typeof initDataRaw !== "string") {
    return { valid: false, reason: "init_data_missing" };
  }

  try {
    const urlParams = new URLSearchParams(initDataRaw);
    const receivedHash = urlParams.get("hash")?.trim().toLowerCase();
    if (!receivedHash) {
      return { valid: false, reason: "hash_missing" };
    }
    urlParams.delete("hash");

    const authDateStr = urlParams.get("auth_date");
    if (authDateStr) {
      const authDate = Number(authDateStr);
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 86400 * 30; // 30 days tolerance for cached WebApp sessions
      const maxFuture = 86400; // 1 day clock skew tolerance
      if (now - authDate > maxAge || authDate - now > maxFuture) {
        return { valid: false, reason: "auth_date_expired" };
      }
    }

    urlParams.sort();
    const dataCheckString = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex")
      .toLowerCase();

    const calcBuf = Buffer.from(calculatedHash, "hex");
    const recBuf = Buffer.from(receivedHash, "hex");

    if (calcBuf.length !== recBuf.length || !crypto.timingSafeEqual(calcBuf, recBuf)) {
      return { valid: false, reason: "hash_mismatch" };
    }

    const userRaw = urlParams.get("user");
    if (!userRaw) {
      return { valid: false, reason: "user_missing_in_init_data" };
    }

    const parsedUser = JSON.parse(userRaw);
    const user: TelegramUser = {
      id: parsedUser.id,
      first_name: parsedUser.first_name || "",
      last_name: parsedUser.last_name || undefined,
      username: parsedUser.username || undefined,
      photo_url: parsedUser.photo_url || undefined,
      auth_date: authDateStr ? Number(authDateStr) : undefined,
    };

    return { valid: true, user };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "invalid_format";
    return { valid: false, reason: msg };
  }
}

/**
 * Finds or creates a user account from Telegram auth, establishes a session cookie.
 */
export async function findOrCreateTelegramUser(
  profile: TelegramUser,
): Promise<{ user: UserDTO; token: string }> {
  await connectDB();

  const providerId = String(profile.id);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || profile.username || `Telegram User ${providerId}`;
  const photo = profile.photo_url ?? "";

  // Platform admin check for the very first user on fresh installs
  const isFirstUser = (await User.estimatedDocumentCount()) === 0;

  // Check if this Telegram account is already registered
  const existingUser = await User.findOne({ provider: "telegram", providerId }).lean();

  let emailToUse = existingUser?.email;
  if (!emailToUse) {
    const candidate = profile.username
      ? `${profile.username.toLowerCase()}@telegram.org`
      : `${providerId}@telegram.org`;
    const taken = await User.exists({ email: candidate });
    if (taken) {
      emailToUse = `${providerId}@telegram.org`;
    } else {
      emailToUse = candidate;
    }
  }

  const user = await User.findOneAndUpdate(
    { providerId, provider: "telegram" },
    {
      $set: {
        name: displayName,
        image: photo || (existingUser?.image ?? ""),
        telegramChatId: providerId,
      },
      $setOnInsert: {
        email: emailToUse.toLowerCase(),
        provider: "telegram",
        providerId,
        status: "active",
        role: isFirstUser ? "admin" : "business_owner",
        maxBusinesses: isFirstUser ? 1000 : 3,
        maxCatalogs: isFirstUser ? 1000 : 50,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  ).lean();

  if (!user) {
    throw new Error("Failed to find or create telegram user");
  }

  if (user.status !== "active") {
    throw new Error("account_inactive");
  }

  const token = await setSessionCookie({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  });

  return { user: toUserDTO(user), token };
}
