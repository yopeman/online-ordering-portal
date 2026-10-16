import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, LayoutGrid, Pencil, Plus } from "lucide-react";

import { DeleteProductButton } from "@/components/business/delete-product-button";
import { ProductForm } from "@/components/business/product-form";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessForOwner, listAttachments, listProductCategories, listProductsForBusiness } from "@/lib/queries";

export const metadata = { title: "Catalog" };

export default async function CatalogTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/businesses/${id}/catalog`);
  const t = await getTranslator();
  const { price: formatPrice } = await getFormatters();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  const [products, categories] = await Promise.all([
    listProductsForBusiness(id, { includeInactive: true }),
    listProductCategories(id),
  ]);

  const attachmentsByProduct = await Promise.all(
    products.map(async (product) => {
      const attachments = await listAttachments("catalog", product.id);
      return [
        product.id,
        attachments.map((attachment) => ({
          url: attachment.url,
          alt: attachment.alt ?? "",
          kind: attachment.kind ?? "image",
        })),
      ] as const;
    }),
  );
  const attachmentMap = new Map(attachmentsByProduct);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("business.catalogTitle")}
        description={t("business.catalogSubtitle")}
        action={
          <Badge tone="neutral">
            {t("business.productsCount", { count: products.length })}
          </Badge>
        }
      />

      <ProductForm
        businessId={id}
        values={{
          name: "",
          slug: "",
          category: "",
          description: "",
          price: "",
          currency: "ETB",
          image: "",
          isActive: true,
          attachments: [],
        }}
        categories={categories}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8" />}
          title={t("business.noProducts")}
          description={t("business.noProductsHint")}
          action={
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="h-4 w-4" />
              {t("business.addProduct")}
            </span>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {products.map((product) => {
              return (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {product.name}
                      </p>
                      {product.category ? (
                        <Badge tone="neutral">{product.category}</Badge>
                      ) : null}
                      {!product.isActive ? (
                        <Badge tone="warning">{t("dashboard.inactive")}</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(product.price, product.currency)} · /
                      {product.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      aria-label={t("common.view")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <a
                      href={`#edit-${product.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </a>
                    <DeleteProductButton
                      businessId={id}
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("common.edit")}
        </h2>
        {products.map((product) => (
          <div key={product.id} id={`edit-${product.id}`} data-product-edit={product.id}>
            <ProductForm
              businessId={id}
              productId={product.id}
              categories={categories}
              values={{
                name: product.name,
                slug: product.slug,
                category: product.category,
                description: product.description,
                price: String(product.price),
                currency: product.currency,
                image: product.image,
                isActive: product.isActive,
                attachments: attachmentMap.get(product.id) ?? [],
              }}
            />
          </div>
        ))}
      </section>
    </div>
  );
}