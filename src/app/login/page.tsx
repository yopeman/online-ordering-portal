import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, LogIn } from "lucide-react";

import { Alert } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { googleIsConfigured } from "@/lib/google-auth";
import {
  getTelegramBotUsername,
  getTelegramCallbackUrl,
  telegramIsConfigured,
} from "@/lib/telegram-auth";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { getTranslator } from "@/lib/i18n-server";
import { devAccountsEnabled, listDevAccounts } from "@/lib/dev-accounts";

export const metadata = { title: "Sign in" };

const ERROR_KEYS: Record<string, string> = {
  google_failed: "login.googleFailed",
  state_mismatch: "login.googleFailed",
  telegram_failed: "login.telegramFailed",
  account_inactive: "login.sessionExpired",
  not_configured: "login.googleNotConfigured",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const t = await getTranslator();

  const next = params.next?.startsWith("/") ? params.next : "/businesses";
  if (user) redirect(next);

  const googleReady = googleIsConfigured();
  const telegramReady = telegramIsConfigured();
  const botUsername = getTelegramBotUsername();
  const telegramAuthUrl = getTelegramCallbackUrl(undefined, next);
  const devAccounts = devAccountsEnabled() ? await listDevAccounts() : [];

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("login.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        {params.error ? (
          <Alert tone="danger" className="mt-5">
            {t(ERROR_KEYS[params.error] ?? "login.googleFailed")}
          </Alert>
        ) : null}

        <div className="mt-6 space-y-4">
          {/* {googleReady ? (
            <a
              href={`/api/auth/google?next=${encodeURIComponent(next)}`}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <GoogleMark />
              {t("login.google")}
            </a>
          ) : (
            <div className="space-y-2">
              <div className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {t("login.googleNotConfigured")}
              </div>
              <p className="text-xs text-muted-foreground">{t("login.configureHint")}</p>
            </div>
          )}

          {googleReady && telegramReady ? (
            <div className="relative flex items-center justify-center py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-2.5 text-xs uppercase tracking-wider text-muted-foreground">
                {t("login.or")}
              </span>
            </div>
          ) : null} */}

          {telegramReady ? (
            <div className="flex w-full justify-center">
              <TelegramLoginButton
                botUsername={botUsername}
                authUrl={telegramAuthUrl}
                next={next}
                labels={{
                  authenticating: t("login.telegramAuthenticating"),
                  errorPrefix: t("errors.generic"),
                  retry: t("common.retry"),
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {t("login.telegramNotConfigured")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("login.telegramConfigureHint")}
              </p>
            </div>
          )}

          {devAccounts.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-dashed border-primary-border bg-primary-soft p-3">
              <p className="text-xs font-medium text-primary">{t("login.devTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("login.devHint")}</p>
              <ul className="space-y-1.5 pt-1">
                {devAccounts.map((account) => (
                  <li key={account.id}>
                    <form
                      action={`/api/auth/dev-login?next=${encodeURIComponent(next)}`}
                      method="post"
                    >
                      <input type="hidden" name="userId" value={account.id} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs transition-colors hover:bg-surface-muted"
                      >
                        <span>
                          <span className="block font-medium text-foreground">
                            {account.name}
                          </span>
                          <span className="block text-muted-foreground">
                            {account.email} · {account.role}
                          </span>
                        </span>
                        <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("errors.backHome")}
          </Link>
          <Link href="/marketplace" className="text-xs text-primary hover:underline">
            {t("nav.marketplace")}
          </Link>
        </div>
      </Card>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.16-4.06 1.16-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.29a12 12 0 0 0 0 10.78l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.61l4 3.09C6.23 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}