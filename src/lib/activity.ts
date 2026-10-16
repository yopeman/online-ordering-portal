import "server-only";

import { connectDB } from "@/lib/db";
import { Activity, type ActivityAction } from "@/lib/models/activity";

export interface LogActivityInput {
  businessId: string;
  action: ActivityAction;
  detail?: string;
  actorId?: string | null;
  isRead?: boolean;
}

/**
 * Best effort activity logging — a failure here must never break the write
 * that triggered it, so errors are swallowed on purpose.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await Activity.create({
      business: input.businessId,
      action: input.action,
      detail: input.detail ?? "",
      actor: input.actorId ?? null,
      isRead: input.isRead ?? false,
    });
  } catch (error) {
    console.error("[activity] failed to log activity", error);
  }
}