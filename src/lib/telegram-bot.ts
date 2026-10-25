import { Bot, type TelegramMessage } from "neogram";

const globalForTelegramBot = globalThis as unknown as {
  __yopeTelegramBot?: Bot | null;
  __yopeTelegramPollingActive?: boolean;
};

function isCommandMatch(msg: TelegramMessage): boolean {
  const text = (msg?.text || "").trim();
  if (!text) return false;

  // Handles /start, /chatid, /chat_id, /id with optional @botusername and arguments
  if (/^\/(start|chatid|chat_id|id)(?:@\w+)?(?:\s.*)?$/i.test(text)) {
    return true;
  }

  const lower = text.toLowerCase();
  if (lower === "start" || lower === "chatid" || lower === "chat_id" || lower === "id") {
    return true;
  }

  const entities = (msg as { entities?: { type: string; offset: number; length: number }[] }).entities;
  if (Array.isArray(entities)) {
    const cmdEntity = entities.find((e) => e.type === "bot_command" && e.offset === 0);
    if (cmdEntity) {
      const cmd = text.slice(0, cmdEntity.length).toLowerCase().split("@")[0];
      if (cmd === "/start" || cmd === "/chatid" || cmd === "/chat_id" || cmd === "/id") {
        return true;
      }
    }
  }

  return false;
}

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
    if (isCommandMatch(msg)) {
      const chatId = msg.chat?.id || msg.from?.id;
      if (!chatId) return;
      console.log("Chat ID:", chatId);
      try {
        await bot.sendMessage({
          chat_id: chatId,
          text: `Your chat ID is: ${chatId}`,
        });
      } catch (err: unknown) {
        console.error("Failed to send message to chat:", err);
      }
    }
  });

  bot
    .infinityPolling()
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
