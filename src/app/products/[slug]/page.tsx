import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff, Store } from "lucide-react";

import {
  OrderForm,
  type OrderFormFieldDTO,
} from "@/components/business/order-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import {
  DEFAULT_ORDER_FORM_FIELDS,
  readCatalogDetails,
  readOrderFormTemplates,
} from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getProductBySlug, listAttachments } from "@/lib/queries";
import { Catalog } from "@/lib/models";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslator();
  const { price: formatPriceAmount } = await getFormatters();

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  await connectDB();
  const raw = await Catalog.findOne({ slug }).lean();
  const details = readCatalogDetails(raw?.details);

  const businessDoc = raw?.business;
  const templates =
    businessDoc && typeof businessDoc === "object" && "orderFormTemplates" in businessDoc
      ? readOrderFormTemplates((businessDoc as { orderFormTemplates: unknown }).orderFormTemplates)
      : [];

  const fields: OrderFormFieldDTO[] = (
    templates.length > 0 ? templates : DEFAULT_ORDER_FORM_FIELDS
  ).map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    placeholder: field.placeholder ?? "",
    options: field.options ?? [],
  }));

  const attachments = await listAttachments("catalog", product.id);

  const extraDetails = Object.entries(details).filter(
    ([key, value]) =>
      !["description", "available", "ingredients", "preparationTime"].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== "",
  );

  return (
    <div className="container-page py-8">
      <Link
        href={product.businessSlug ? `/store/${product.businessSlug}` : "/marketplace"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("product.backToBusiness")}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="relative flex h-64 items-center justify-center bg-surface-muted sm:h-80">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={t("product.imageOf").replace("{name}", product.name)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover"
                />
              ) : (
                <ImageOff className="h-12 w-12 text-subtle-foreground" />
              )}
            </div>
          </Card>

          {attachments.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {attachments.map((attachment) => (
                <a
                  key={String(attachment._id)}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted"
                >
                  <Image
                    src={attachment.url}
                    alt={attachment.alt || product.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.category ? <Badge tone="primary">{product.category}</Badge> : null}
              {product.businessName ? (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Store className="h-3.5 w-3.5" />
                  {product.businessName}
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="text-xl font-semibold text-primary">
              {formatPriceAmount(product.price, product.currency)}
            </p>
            {product.description ? (
              <p className="whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            ) : null}
          </div>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-foreground">
              {t("product.detailsTitle")}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {details.ingredients ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("catalog.longDescription")}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {Array.isArray(details.ingredients)
                      ? details.ingredients.join(", ")
                      : String(details.ingredients)}
                  </dd>
                </div>
              ) : null}
              {details.preparationTime ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("common.details")}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {String(details.preparationTime)}
                  </dd>
                </div>
              ) : null}
              {extraDetails.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="text-sm text-foreground">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-foreground">
              {t("product.orderNow")}
            </h2>
            <OrderForm
              slug={product.slug}
              fields={fields}
              price={product.price}
              currency={product.currency}
            />
          </Card>

          {product.businessSlug ? (
            <div className="mt-4 flex justify-center">
              <Link href={`/store/${product.businessSlug}`}>
                <Button variant="secondary">
                  <Store className="h-4 w-4" />
                  {t("businessPublic.menu")}
                </Button>
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}