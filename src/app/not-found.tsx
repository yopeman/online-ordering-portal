import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n-server";

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold text-foreground">{t("errors.notFound")}</h1>
      <Link href="/">
        <Button variant="secondary">{t("errors.backHome")}</Button>
      </Link>
    </div>
  );
}