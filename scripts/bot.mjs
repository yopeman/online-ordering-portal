import { Bot } from "neogram";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

if (!telegramBotToken) {
  console.error("TELEGRAM_BOT_TOKEN is not configured in environment or .env.local");
  process.exit(1);
}

const bot = new Bot(telegramBotToken);

function isCommandMatch(msg) {
  const text = (msg?.text || msg?.caption || "").trim();
  if (!text) return false;

  // Handles /start, /chatid, /chat_id, /id with optional @botusername and arguments
  if (/^\/(start|chatid|chat_id|id)(?:@\w+)?(?:\s.*)?$/i.test(text)) {
    return true;
  }

  const lower = text.toLowerCase();
  if (lower === "start" || lower === "chatid" || lower === "chat_id" || lower === "id") {
    return true;
  }

  if (Array.isArray(msg?.entities)) {
    const cmdEntity = msg.entities.find((e) => e.type === "bot_command" && e.offset === 0);
    if (cmdEntity) {
      const cmd = text.slice(0, cmdEntity.length).toLowerCase().split("@")[0];
      if (cmd === "/start" || cmd === "/chatid" || cmd === "/chat_id" || cmd === "/id") {
        return true;
      }
    }
  }

  return false;
}

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
      console.log(`[Telegram] Sent chat ID to ${chatId}`);
    } catch (err) {
      console.error(`[Telegram] Failed to send chat ID to ${chatId}:`, err.message || err);
    }
  }
});

try {
  await bot.deleteWebhook({ drop_pending_updates: false });
} catch (err) {
  console.warn("Could not delete webhook:", err.message);
}

bot
  .infinityPolling()
  .catch((err) => {
    console.error("Telegram bot polling failed:", err.message);
    console.log(
      "Set TELEGRAM_BOT_ENABLED=false to disable polling (e.g. when another instance polls this bot)",
    );
  });

console.log("Telegram bot enabled (polling started)");
