import "server-only";

import { Bot } from "neogram";
import { connectDB } from "@/lib/db";
import {
  Business,
  readContacts,
  User,
  type BusinessContact,
  type BusinessContactType,
} from "@/lib/models";
import { getTelegramBot } from "@/lib/telegram-bot";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let botInstance: Bot | null = null;

function getBot(): Bot | null {
  const activeBot = getTelegramBot();
  if (activeBot) return activeBot;

  if (!TELEGRAM_BOT_TOKEN) return null;
  if (!botInstance) {
    try {
      botInstance = new Bot(TELEGRAM_BOT_TOKEN);
    } catch (err) {
      console.error("[Telegram] Error initializing Bot with token:", err);
    }
  }
  return botInstance;
}

/**
 * Normalizes Telegram targets:
 * - https://t.me/post_timir_content -> @post_timir_content
 * - t.me/post_timir_content -> @post_timir_content
 * - post_timir_content -> @post_timir_content
 * - -100123456789 -> -100123456789
 * - 123456789 -> 123456789
 */
export function normalizeTelegramChatId(input: string): string {
  let clean = input.trim();
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "");
  clean = clean.replace(/^\/+|\/+$/g, "");
  if (!clean) return "";
  // If it's pure digits (optionally with minus for group/channel ID), return as-is
  if (/^-?\d+$/.test(clean)) return clean;
  // If it is a username/channel handle, ensure leading @
  if (!clean.startsWith("@")) clean = `@${clean}`;
  return clean;
}

/**
 * Sends a Telegram message via neogram using TELEGRAM_BOT_TOKEN.
 */
export async function sendTelegramMessage(target: string, message: string): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    console.warn("[Telegram] Bot token is not configured.");
    return false;
  }

  const chatId = normalizeTelegramChatId(target);
  if (!chatId) {
    console.warn("[Telegram] Could not resolve a valid chat_id from target:", target);
    return false;
  }

  try {
    await bot.sendMessage({
      chat_id: chatId,
      text: message,
    });
    console.log(`[Telegram] Successfully sent message to ${chatId}`);
    return true;
  } catch (err: unknown) {
    console.error(
      `[Telegram] Failed to send message to ${chatId}:`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * SMS notification channel - simply logs the message.
 */
export async function sendSmsMessage(target: string, message: string): Promise<void> {
  console.log(`[SMS Notification] To: ${target}\nMessage:\n${message}`);
}

/**
 * WhatsApp notification channel - simply logs the message.
 */
export async function sendWhatsAppMessage(target: string, message: string): Promise<void> {
  console.log(`[WhatsApp Notification] To: ${target}\nMessage:\n${message}`);
}

/**
 * Email notification channel - simply logs the message.
 */
export async function sendEmailMessage(target: string, message: string): Promise<void> {
  console.log(`[Email Notification] To: ${target}\nMessage:\n${message}`);
}

/**
 * Generic notification dispatcher across channels.
 */
export async function sendChannelMessage(
  channel: BusinessContactType | string,
  target: string,
  message: string,
): Promise<void> {
  const type = (channel || "").toLowerCase();
  switch (type) {
    case "telegram":
      await sendTelegramMessage(target, message);
      break;
    case "sms":
      await sendSmsMessage(target, message);
      break;
    case "wa":
    case "whatsapp":
      await sendWhatsAppMessage(target, message);
      break;
    case "email":
      await sendEmailMessage(target, message);
      break;
    default:
      console.log(
        `[${type.toUpperCase() || "CHANNEL"} Notification] To: ${target}\nMessage:\n${message}`,
      );
      break;
  }
}

export interface OrderNotificationPayload {
  businessName: string;
  productName: string;
  quantity: number;
  price: number;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  custom?: Record<string, string>;
  contactPhone?: string;
}

export function formatOrderNotification(data: OrderNotificationPayload): string {
  const total = data.price * data.quantity;
  const lines = [
    `🛒 New Order Received!`,
    ``,
    `Business: ${data.businessName}`,
    `Product: ${data.productName} × ${data.quantity}`,
    `Total: ${total} ${data.currency}`,
    ``,
    `Customer:`,
    `• Name: ${data.customerName || "Anonymous"}`,
  ];
  if (data.customerPhone) {
    lines.push(`• Phone: ${data.customerPhone}`);
  }
  if (data.note) {
    lines.push(`• Note: ${data.note}`);
  }
  if (data.contactPhone) {
    lines.push(`• Contact Ref: ${data.contactPhone}`);
  }
  if (data.custom && Object.keys(data.custom).length > 0) {
    lines.push(``, `Additional Details:`);
    for (const [key, val] of Object.entries(data.custom)) {
      if (val) {
        lines.push(`• ${key}: ${val}`);
      }
    }
  }
  return lines.join("\n");
}

/**
 * Dispatches an order notification to the business contact channels.
 */
export async function dispatchOrderNotification(
  contacts: BusinessContact[],
  payload: OrderNotificationPayload,
): Promise<void> {
  const message = formatOrderNotification(payload);

  if (contacts.length === 0) {
    console.log(
      `[Order Notification] No contacts configured for business "${payload.businessName}".\n${message}`,
    );
    return;
  }

  // Deduplicate contacts by type + target
  const seen = new Set<string>();
  const uniqueContacts: BusinessContact[] = [];
  for (const c of contacts) {
    const key = `${c.type}:${c.target}`.toLowerCase();
    if (!seen.has(key) && c.target) {
      seen.add(key);
      uniqueContacts.push(c);
    }
  }

  await Promise.allSettled(
    uniqueContacts.map((contact) =>
      sendChannelMessage(contact.type, contact.target, message),
    ),
  );
}

/**
 * Formats a clean, readable Telegram notification for a business activity.
 */
export function formatActivityNotification(
  businessName: string,
  action: string,
  detail: string,
): string {
  const cleanDetail = detail ? detail.replace(/\*\*/g, "") : "";
  const header = (() => {
    switch (action) {
      case "order.received":
        return "🛒 New Order Received!";
      case "order.read":
        return "📬 Order Marked as Read";
      case "product.viewed":
        return "👀 Product Viewed";
      case "store.viewed":
      case "business.viewed":
        return "🏪 Store Visited";
      case "catalog.created":
        return "📦 Product Added";
      case "catalog.updated":
        return "✏️ Product Updated";
      case "catalog.deleted":
        return "🗑️ Product Deleted";
      case "business.created":
        return "🎉 Business Created";
      case "business.updated":
        return "🏢 Business Updated";
      default:
        return "🔔 Business Notification";
    }
  })();

  const lines = [header, ``, `Business: ${businessName}`];
  if (cleanDetail) {
    lines.push(cleanDetail);
  }
  return lines.join("\n");
}

/**
 * Dispatches an activity notification to the business owner's stored Telegram bot chat ID
 * (and any configured telegram contacts).
 */
export async function dispatchActivityNotification(input: {
  businessId: string;
  action: string;
  detail?: string;
}): Promise<void> {
  try {
    if (!input.businessId) return;

    await connectDB();
    const business = await Business.findById(input.businessId)
      .select("name owner contactPhones")
      .lean();
    if (!business) return;

    const owner = business.owner
      ? await User.findById(business.owner).select("telegramChatId name").lean()
      : null;

    const chatIds = new Set<string>();

    // 1. Primary: Use stored telegram bot chat ID of the business owner
    if (owner?.telegramChatId && String(owner.telegramChatId).trim()) {
      chatIds.add(String(owner.telegramChatId).trim());
    }

    // 2. Also include any telegram contact configured in business contacts
    const contacts = readContacts(business.contactPhones);
    for (const c of contacts) {
      if ((c.type || "").toLowerCase() === "telegram" && c.target?.trim()) {
        chatIds.add(c.target.trim());
      }
    }

    if (chatIds.size === 0) {
      console.log(
        `[Activity Notification] No stored Telegram chat ID found for business "${business.name}" (${input.businessId}).`,
      );
      return;
    }

    const message = formatActivityNotification(
      business.name,
      input.action,
      input.detail ?? "",
    );

    await Promise.allSettled(
      Array.from(chatIds).map((chatId) => sendTelegramMessage(chatId, message)),
    );
  } catch (error) {
    console.error("[Activity Notification] Failed to dispatch activity notification:", error);
  }
}
