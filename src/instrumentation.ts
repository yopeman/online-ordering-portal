export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Avoid starting background polling during production build (next build)
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build" ||
      process.argv.some((arg) => arg === "build");

    if (!isBuild) {
      const { startTelegramBot } = await import("@/lib/telegram-bot");
      await startTelegramBot();
    }
  }
}
