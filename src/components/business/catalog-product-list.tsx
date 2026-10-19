"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ExternalLink,
  ImageOff,
  LayoutGrid,
  List,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { deleteProductAction } from "@/app/actions/catalog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers/app-provider";
import {
  EMPTY_PRODUCT,
  ProductFormModal,
  type ProductFormValues,
} from "@/components/business/product-form-modal";
import type { ProductListItem } from "@/lib/queries";
import type { ActionState } from "@/app/actions/businesses";

export interface CatalogRow extends ProductListItem {
  files: { url: string; name: string; size: number; type: string }[];
  /** Formatted on the server — functions cannot cross the RSC boundary. */
  priceLabel: string;
}

/**
 * A server action reference passed straight from a server component — it must
 * not be wrapped, otherwise it cannot cross the RSC boundary.
 */
export type SubmitFn = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function CatalogProductList({
  businessId,
  products,
  createAction,
  updateAction,
  limitReached,
}: {
  businessId: string;
  products: CatalogRow[];
  createAction: SubmitFn;
  updateAction: SubmitFn;
  limitReached: boolean;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setError(undefined);
    setOpen(true);
  }

  function openEdit(product: CatalogRow) {
    setEditing(product);
    setError(undefined);
    setOpen(true);
  }

  function submit(formData: FormData) {
    formData.set("businessId", businessId);
    if (editing) formData.set("productId", editing.id);

    setError(undefined);
    startTransition(async () => {
      const action = editing ? updateAction : createAction;
      const result = await action({ ok: false }, formData);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error ?? t("errors.generic"));
      }
    });
  }

  const values: ProductFormValues = editing
    ? {
        id: editing.id,
        name: editing.name,
        category: editing.category,
        details: editing.description ? [{ key: "description", value: editing.description }] : [],
        files: editing.files,
        image: editing.image,
        price: String(editing.price),
        currency: editing.currency,
        isActive: editing.isActive,
      }
    : EMPTY_PRODUCT;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{t("business.catalogTitle")}</h2>
          {products.length > 0 ? (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-surface-muted text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Grid view"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-surface-muted text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={limitReached}>
          <Plus className="h-4 w-4" />
          {t("business.addProduct")}
        </Button>
      </div>

      {limitReached ? (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("dashboard.catalogLimit", { max: 50 })}
        </p>
      ) : null}

      {products.length === 0 ? null : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const coverImage = product.files[0]?.url || product.image;
            return (
              <Card
                key={product.id}
                className="group flex flex-col overflow-hidden transition-all duration-200 hover:border-primary-border hover:shadow-md"
              >
                {/* Cover Image (Index 0 image) */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized={coverImage.startsWith("http://") || coverImage.startsWith("/uploads/")}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/50">
                      <ImageOff className="h-9 w-9 stroke-[1.5]" />
                      <span className="mt-1 text-xs">No image</span>
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 pointer-events-none">
                    <div className="flex flex-wrap gap-1">
                      {product.category ? (
                        <Badge tone="neutral" className="bg-surface/90 backdrop-blur-xs font-medium shadow-xs">
                          {product.category}
                        </Badge>
                      ) : <span />}
                    </div>
                    {!product.isActive ? (
                      <Badge tone="warning" className="backdrop-blur-xs font-medium shadow-xs">
                        {t("dashboard.inactive")}
                      </Badge>
                    ) : (
                      <Badge tone="success" className="backdrop-blur-xs font-medium shadow-xs">
                        {t("catalog.active")}
                      </Badge>
                    )}
                  </div>

                  {/* Additional files counter */}
                  {product.files.length > 1 ? (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                      <Paperclip className="h-3 w-3" />
                      <span>{product.files.length}</span>
                    </div>
                  ) : null}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${product.slug}`}
                        className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                        title={product.name}
                      >
                        {product.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        /{product.slug}
                      </p>
                    </div>
                    <span className="shrink-0 text-base font-bold text-primary">
                      {product.priceLabel}
                    </span>
                  </div>

                  {product.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  ) : null}

                  {/* Actions Bar */}
                  <div className="mt-auto flex items-center justify-end gap-1.5 pt-4 border-t border-border/60">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                      aria-label={t("common.view")}
                      title={t("common.view")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer"
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <ConfirmDialog
                      title={t("catalog.deleteTitle")}
                      description={t("catalog.deleteBody", { name: product.name })}
                      confirmLabel={t("common.confirmDelete")}
                      cancelLabel={t("common.cancel")}
                      trigger={
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger cursor-pointer"
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </span>
                      }
                      onConfirm={async () => {
                        const formData = new FormData();
                        formData.set("businessId", businessId);
                        formData.set("productId", product.id);
                        await deleteProductAction(formData);
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {products.map((product) => {
              const coverImage = product.files[0]?.url || product.image;
              return (
                <div key={product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  {/* Thumbnail */}
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-muted border border-border">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={product.name}
                        fill
                        sizes="44px"
                        unoptimized={coverImage.startsWith("http://") || coverImage.startsWith("/uploads/")}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="truncate font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                      {product.category ? (
                        <Badge tone="neutral">{product.category}</Badge>
                      ) : null}
                      {!product.isActive ? (
                        <Badge tone="warning">{t("dashboard.inactive")}</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.priceLabel} · /{product.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      aria-label={t("common.view")}
                      title={t("common.view")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground cursor-pointer"
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <ConfirmDialog
                      title={t("catalog.deleteTitle")}
                      description={t("catalog.deleteBody", { name: product.name })}
                      confirmLabel={t("common.confirmDelete")}
                      cancelLabel={t("common.cancel")}
                      trigger={
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-danger/40 hover:bg-danger-soft hover:text-danger cursor-pointer"
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </span>
                      }
                      onConfirm={async () => {
                        const formData = new FormData();
                        formData.set("businessId", businessId);
                        formData.set("productId", product.id);
                        await deleteProductAction(formData);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {open ? (
        <ProductFormModal
          key={editing?.id ?? "new"}
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={submit}
          values={values}
          busy={pending}
          error={error}
        />
      ) : null}
    </div>
  );
}