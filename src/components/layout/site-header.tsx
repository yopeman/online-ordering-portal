import Link from "next/link";
import { Store } from "lucide-react";

import { LocaleSwitcher, ThemeSwitcher } from "@/components/layout/preference-switchers";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { getTranslator } from "@/lib/i18n-server";

export async function SiteHeader() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslator()]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              Y
            </span>
            <span className="hidden text-foreground sm:inline">Yope Order</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/marketplace"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {t("nav.marketplace")}
            </Link>
            {user ? (
              <Link
                href="/businesses"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {t("nav.myBusinesses")}
              </Link>
            ) : null}
            {isAdmin(user) ? (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {t("nav.admin")}
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher />

          {user ? (
            <>
              <Link href="/businesses" className="hidden sm:block">
                <Button variant="secondary" size="sm">
                  <Store className="h-4 w-4" />
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                isAdmin={isAdmin(user)}
              />
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">{t("nav.login")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}