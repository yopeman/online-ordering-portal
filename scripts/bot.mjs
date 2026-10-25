import { Bot } from "neogram";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

if (!telegramBotToken) {
  console.error("TELEGRAM_BOT_TOKEN is not configured in environment or .env.local");
  process.exit(1);
}

const bot = new Bot(telegramBotToken);

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
    } catch (err) {
      console.error(`[Telegram] Failed to send chat ID to ${chatId}:`, err.message);
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
