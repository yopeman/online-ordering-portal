"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Business, Catalog } from "@/lib/models";

export interface LogShareActivityInput {
  businessId?: string;
  type: "business" | "product";
  title: string;
  channel: string;
  url?: string;
  remark?: string;
}

export async function logShareActivityAction(
  input: LogShareActivityInput,
): Promise<{ ok: boolean }> {
  try {
    let businessId = input.businessId?.trim();

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      await connectDB();

      // Attempt to resolve businessId from url
      if (input.url) {
        try {
          const pathname =
            input.url.startsWith("http://") || input.url.startsWith("https://")
              ? new URL(input.url).pathname
              : input.url.split("?")[0];

          const storeMatch = pathname.match(/\/store\/([^/]+)/);
          const productMatch = pathname.match(/\/products\/([^/]+)/);
          const businessMatch = pathname.match(/\/businesses\/([^/]+)/);

          if (storeMatch) {
            const slug = decodeURIComponent(storeMatch[1]);
            const biz = await Business.findOne({ slug }).select("_id").lean();
            if (biz) businessId = (biz._id as mongoose.Types.ObjectId).toString();
          } else if (productMatch) {
            const slug = decodeURIComponent(productMatch[1]);
            const item = await Catalog.findOne({ slug }).select("business").lean();
            if (item) businessId = (item.business as mongoose.Types.ObjectId).toString();
          } else if (businessMatch && mongoose.Types.ObjectId.isValid(businessMatch[1])) {
            businessId = businessMatch[1];
          }
        } catch {
          // ignore url parse error
        }
      }

      // Fallback: look up by title if still unresolved
      if (!businessId && input.title) {
        if (input.type === "business") {
          const biz = await Business.findOne({ name: input.title }).select("_id").lean();
          if (biz) businessId = (biz._id as mongoose.Types.ObjectId).toString();
        } else {
          const item = await Catalog.findOne({ name: input.title }).select("business").lean();
          if (item) businessId = (item.business as mongoose.Types.ObjectId).toString();
        }
      }
    }

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      return { ok: false };
    }

    const currentUser = await getCurrentUser().catch(() => null);

    const channelMap: Record<string, string> = {
      direct_share: "Direct Link",
      copy_link: "Direct Link",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      x_twitter: "X (Twitter)",
      native_share: "Device Share",
      qr_code: "QR Code",
    };

    const channelLabel = channelMap[input.channel] || input.channel;
    const remark = input.remark?.trim();
    const remarkSuffix = remark ? ` (Remark: ${remark})` : "";
    const isProduct = input.type === "product";
    const action = isProduct ? "product.shared" : "store.shared";

    const detail = isProduct
      ? currentUser
        ? `**${currentUser.name}** shared product **${input.title}** via ${channelLabel}${remarkSuffix}.`
        : `Product **${input.title}** was shared via ${channelLabel}${remarkSuffix}.`
      : currentUser
        ? `**${currentUser.name}** shared storefront **${input.title}** via ${channelLabel}${remarkSuffix}.`
        : `Storefront for **${input.title}** was shared via ${channelLabel}${remarkSuffix}.`;

    await logActivity({
      businessId,
      action,
      detail,
      actorId: currentUser?.id ?? null,
      isRead: false,
    });

    revalidatePath(`/businesses/${businessId}/activities`);

    return { ok: true };
  } catch (err) {
    console.error("[activity] failed to log share activity:", err);
    return { ok: false };
  }
}

