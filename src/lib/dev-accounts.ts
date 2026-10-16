import "server-only";

import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

export interface DevAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Local development helper: when Google credentials are missing we allow
 * signing in as an existing account. Never enabled in production.
 */
export function devAccountsEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ENABLE_DEV_LOGIN === "false") return false;
  return !process.env.GOOGLE_CLIENT_ID;
}

export async function listDevAccounts(limit = 5): Promise<DevAccount[]> {
  if (!devAccountsEnabled()) return [];

  try {
    await connectDB();
    const users = await User.find({ status: "active" })
      .sort({ role: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  } catch {
    return [];
  }
}