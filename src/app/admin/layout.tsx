import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { TabsNav } from "@/components/ui/tabs-nav";
import { requireAdmin } from "@/lib/auth/guards";
import { getTranslator } from "@/lib/i18n-server";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");
  const t = await getTranslator();

  return (
    <div className="container-page space-y-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("admin.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
      </div>

      <TabsNav
        items={[
          { href: "/admin", label: t("admin.tabUsers"), icon: "user" },
          {
            href: "/admin/businesses",
            label: t("admin.tabBusinesses"),
            icon: "store",
          },
        ]}
      />

      {children}
    </div>
  );
}