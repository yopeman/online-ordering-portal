import "server-only";

import { Bot } from "neogram";

const globalForTelegramBot = globalThis as unknown as {
  __yopeTelegramBot?: Bot | null;
};

/**
 * Returns the Telegram bot client instance for sending on-demand notifications.
 * No polling is needed or performed — user chat IDs are captured directly during Telegram authentication.
 */
export function getTelegramBot(token?: string): Bot | null {
  const telegramBotToken = token || process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    return null;
  }

  if (!globalForTelegramBot.__yopeTelegramBot) {
    try {
      globalForTelegramBot.__yopeTelegramBot = new Bot(telegramBotToken);
    } catch (err) {
      console.error("[Telegram] Error initializing Bot with token:", err);
      return null;
    }
  }

  return globalForTelegramBot.__yopeTelegramBot;
}
