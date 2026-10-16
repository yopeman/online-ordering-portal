import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessById, listProductsForBusiness } from "@/lib/queries";

export const metadata = { title: "Admin · Catalog" };

export default async function AdminBusinessCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/businesses/${id}/catalog`);
  const t = await getTranslator();
  const { price } = await getFormatters();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const products = await listProductsForBusiness(id, { includeInactive: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.catalogTitle")}
        description={t("admin.catalogSubtitle")}
        action={<Badge tone="warning">{t("admin.readonly")}</Badge>}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8" />}
          title={t("admin.noCatalogs")}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {products.map((product) => (
              <div key={product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {product.name}
                    {product.category ? (
                      <Badge tone="neutral">{product.category}</Badge>
                    ) : null}
                    {!product.isActive ? (
                      <Badge tone="warning">{t("dashboard.inactive")}</Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{product.slug}
                    {product.description ? ` · ${product.description}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {price(product.price, product.currency)}
                </span>
                <Link
                  href={`/products/${product.slug}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("common.view")}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}