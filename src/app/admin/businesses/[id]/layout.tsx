import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TabsNav } from "@/components/ui/tabs-nav";
import { requireAdmin } from "@/lib/auth/guards";
import { readDetails } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessById } from "@/lib/queries";
import { withRemark } from "@/lib/remark";

export const metadata = { title: "Admin · Business" };

export default async function AdminBusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/businesses/${id}`);
  const t = await getTranslator();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const details = readDetails(business.details);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/businesses"
          className="inline-flex items-center gap-1 mt-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("admin.tabBusinesses")}
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {business.name}
              </h2>
              <Badge tone={business.isActive ? "success" : "warning"}>
                {business.isActive ? t("admin.active") : t("admin.inactive")}
              </Badge>
              {details.category ? (
                <Badge tone="neutral">{String(details.category)}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">/{business.slug}</p>
          </div>

          <Link
            href={withRemark(`/store/${business.slug}`, "admin_dashboard")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-muted"
          >
            <ExternalLink className="h-4 w-4" />
            {t("common.view")}
          </Link>
        </div>
      </div>

      <TabsNav
        items={[
          {
            href: `/admin/businesses/${id}/catalog`,
            label: t("admin.catalogTitle"),
            icon: "layoutGrid",
          },
          {
            href: `/admin/businesses/${id}/orders`,
            label: t("admin.ordersTitle"),
            icon: "clipboard",
          },
          {
            href: `/admin/businesses/${id}/activities`,
            label: t("admin.activitiesTitle"),
            icon: "activity",
          },
        ]}
      />

      {children}
    </div>
  );
}