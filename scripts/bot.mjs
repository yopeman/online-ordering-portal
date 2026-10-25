import { Bot } from "neogram";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

if (!telegramBotToken) {
  console.error("TELEGRAM_BOT_TOKEN is not configured in environment or .env.local");
  process.exit(1);
}

const bot = new Bot(telegramBotToken);

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

bot
  .infinityPolling()
  .catch((err) => {
    console.error("Telegram bot polling failed:", err.message);
    console.log(
      "Set TELEGRAM_BOT_ENABLED=false to disable polling (e.g. when another instance polls this bot)",
    );
  });

console.log("Telegram bot enabled (polling started)");
