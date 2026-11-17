import { notFound } from "next/navigation";

import { CatalogProductList, type CatalogRow } from "@/components/business/catalog-product-list";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { PageVideoButton } from "@/components/video";
import { createProductAction, updateProductAction } from "@/app/actions/catalog";
import { requireUser } from "@/lib/auth/guards";
import { readDetails, User } from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import {
  getBusinessForOwner,
  getOwnerOnboardingStats,
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

  const [products, categories, owner, onboardingStats] = await Promise.all([
    listProductsForBusiness(id, { includeInactive: true }),
    listProductCategories(id),
    User.findById(business.owner).select("maxCatalogs").lean(),
    getOwnerOnboardingStats(user.id, id),
  ]);

  const details = readDetails(business.details);

  const attachmentsByProduct = await Promise.all(
    products.map(async (product) => {
      const attachments = await listAttachments("catalog", product.id);
      return [
        product.id,
        attachments.map((attachment) => ({
          url: attachment.url,
          name:
            attachment.alt ||
            (attachment.url.startsWith("data:")
              ? "Attachment"
              : attachment.url.split("/").pop() || "Attachment"),
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
                name: product.image.startsWith("data:")
                  ? "Image"
                  : product.image.split("/").pop() || "Image",
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
          <>
            <PageVideoButton size="sm" />
            <Badge tone="neutral">
              {t("business.productsCount", { count: products.length })} / {maxCatalogs}
            </Badge>
          </>
        }
      />

      <CatalogProductList
        businessId={id}
        businessName={business.name}
        business={{
          id,
          name: business.name,
          slug: business.slug,
          image: business.image,
          description: typeof details.description === "string" ? details.description : "",
        }}
        onboardingStats={onboardingStats}
        products={rows}
        categories={categories}
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