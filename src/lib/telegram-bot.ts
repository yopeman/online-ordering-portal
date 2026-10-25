import { Bot } from "neogram";

const globalForTelegramBot = globalThis as unknown as {
  __yopeTelegramBot?: Bot | null;
  __yopeTelegramPollingActive?: boolean;
};

/**
 * Initializes and starts infinity polling for the Telegram bot.
 */
export async function startTelegramBot(token?: string): Promise<Bot | null> {
  if (process.env.TELEGRAM_BOT_ENABLED === "false") {
    console.log("[Telegram] Bot polling is disabled (TELEGRAM_BOT_ENABLED=false)");
    return null;
  }

  const telegramBotToken = token || process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN is not configured; skipping bot polling.");
    return null;
  }

  // Prevent multiple polling instances in Next.js development hot-reloads
  if (globalForTelegramBot.__yopeTelegramPollingActive && globalForTelegramBot.__yopeTelegramBot) {
    return globalForTelegramBot.__yopeTelegramBot;
  }

  const bot = new Bot(telegramBotToken);
  globalForTelegramBot.__yopeTelegramBot = bot;

  bot.onMessage(async (msg) => {
    console.log("[Telegram] Received message:", JSON.stringify(msg, null, 2));
    const text = (msg.text || "").trim();
    if (text === "/start" || text.startsWith("/start")) {
      const chatId = msg.chat.id;
      console.log("Chat ID:", chatId);
      try {
        await bot.sendMessage({
          chat_id: chatId,
          text: `Your chat ID is: ${chatId}`,
        });
        console.log(`[Telegram] Successfully sent chat ID to ${chatId}`);
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`[Telegram] Failed to send chat ID to ${chatId}:`, error.message);
      }
    }
  });

  try {
    // Delete any active webhook so getUpdates polling doesn't conflict
    await bot.deleteWebhook({ drop_pending_updates: false });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn("[Telegram] Could not delete webhook:", error.message);
  }

  bot.infinityPolling()
    .catch((err: Error) => {
      console.error("Telegram bot polling failed:", err.message);
      console.log(
        "Set TELEGRAM_BOT_ENABLED=false to disable polling (e.g. when another instance polls this bot)",
      );
    });

  globalForTelegramBot.__yopeTelegramPollingActive = true;
  console.log("Telegram bot enabled (polling started)");

  return bot;
}

export function getTelegramBot(): Bot | null {
  return globalForTelegramBot.__yopeTelegramBot || null;
}
