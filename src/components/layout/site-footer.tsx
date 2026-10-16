import Link from "next/link";

import { getTranslator } from "@/lib/i18n-server";

export async function SiteFooter() {
  const t = await getTranslator();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {year} Yope Order. {t("footer.rights")}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            className="hover:text-foreground"
          >
            {t("nav.marketplace")}
          </Link>
          <Link href="/login" className="hover:text-foreground">
            {t("nav.login")}
          </Link>
        </div>
      </div>
    </footer>
  );
}