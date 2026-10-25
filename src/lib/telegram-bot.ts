import { Bot } from "neogram";

const globalForTelegramBot = globalThis as unknown as {
  __yopeTelegramBot?: Bot | null;
  __yopeTelegramPollingActive?: boolean;
};

/**
 * Initializes and starts infinity polling for the Telegram bot.
 */
export function startTelegramBot(token?: string): Bot | null {
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
    console.log(msg);
    if (msg.text === "/start") {
      const chatId = msg.chat.id;
      console.log("Chat ID:", chatId);
      await bot.sendMessage({
        chat_id: chatId,
        text: `Your chat ID is: ${chatId}`,
      });
    }
  });

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
