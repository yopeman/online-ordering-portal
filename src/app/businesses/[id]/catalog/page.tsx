import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { CatalogProductList, type CatalogRow } from "@/components/business/catalog-product-list";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createProductAction, updateProductAction } from "@/app/actions/catalog";
import { requireUser } from "@/lib/auth/guards";
import { User } from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import {
  getBusinessForOwner,
  listAttachments,
  listProductCategories,
  listProductsForBusiness,
} from "@/lib/queries";

export const metadata = { title: "Catalog" };

export default async function CatalogTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/businesses/${id}/catalog`);
  const t = await getTranslator();
  const { price } = await getFormatters();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  const [products, categories, owner] = await Promise.all([
    listProductsForBusiness(id, { includeInactive: true }),
    listProductCategories(id),
    User.findById(business.owner).select("maxCatalogs").lean(),
  ]);

  const attachmentsByProduct = await Promise.all(
    products.map(async (product) => {
      const attachments = await listAttachments("catalog", product.id);
      return [
        product.id,
        attachments.map((attachment) => ({
          url: attachment.url,
          name: attachment.alt || attachment.url.split("/").pop() || "",
          size: 0,
          type: attachment.kind === "file" ? "file" : "image",
        })),
      ] as const;
    }),
  );
  const attachmentMap = new Map(attachmentsByProduct);

  const rows: CatalogRow[] = products.map((product) => {
    const productAttachments = attachmentMap.get(product.id) ?? [];
    const files =
      productAttachments.length > 0
        ? productAttachments
        : product.image
          ? [
              {
                url: product.image,
                name: product.image.split("/").pop() || "",
                size: 0,
                type: "image",
              },
            ]
          : [];

    return {
      ...product,
      priceLabel: price(product.price, product.currency),
      files,
    };
  });

  const maxCatalogs = owner?.maxCatalogs ?? 50;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("business.catalogTitle")}
        description={t("business.catalogSubtitle")}
        action={
          <Badge tone="neutral">
            {t("business.productsCount", { count: products.length })} / {maxCatalogs}
          </Badge>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8" />}
          title={t("business.noProducts")}
          description={t("business.noProductsHint")}
        />
      ) : null}

      <CatalogProductList
        businessId={id}
        products={rows}
        createAction={createProductAction}
        updateAction={updateProductAction}
        limitReached={products.length >= maxCatalogs}
      />

      {categories.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("catalog.category")}: {categories.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}