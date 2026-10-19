import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/queries";
import { formatPrice } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export function ProductCard({
  product,
  locale,
  altLabel,
  showBusiness = false,
}: {
  product: ProductListItem;
  locale: Locale;
  altLabel: string;
  showBusiness?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary-border"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-surface-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={altLabel.replace("{name}", product.name)}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            unoptimized={product.image.startsWith("data:") || product.image.startsWith("http://")}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageOff className="h-8 w-8 text-subtle-foreground" />
        )}
        {product.category ? (
          <span className="absolute left-3 top-3">
            <Badge tone="neutral">{product.category}</Badge>
          </span>
        ) : null}
        {!product.isActive ? (
          <span className="absolute right-3 top-3">
            <Badge tone="warning">•</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {showBusiness && product.businessName ? (
          <p className="text-xs text-muted-foreground">{product.businessName}</p>
        ) : null}
        <h3 className="font-medium text-foreground">{product.name}</h3>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        ) : null}
        <p className="mt-auto pt-2 text-sm font-semibold text-primary">
          {formatPrice(product.price, locale, product.currency)}
        </p>
      </div>
    </Link>
  );
}