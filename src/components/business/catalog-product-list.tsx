"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">{t("business.catalogTitle")}</h2>
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

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-foreground">{product.name}</p>
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
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  aria-label={t("common.edit")}
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                      aria-label={t("common.delete")}
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
          ))}
        </div>
      </Card>

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