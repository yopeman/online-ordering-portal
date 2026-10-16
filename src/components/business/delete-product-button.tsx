"use client";

import { Trash2 } from "lucide-react";

import { deleteProductAction } from "@/app/actions/catalog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApp } from "@/components/providers/app-provider";

export function DeleteProductButton({
  businessId,
  productId,
  productName,
}: {
  businessId: string;
  productId: string;
  productName: string;
}) {
  const { t } = useApp();

  return (
    <ConfirmDialog
      title={t("catalog.deleteTitle")}
      description={t("catalog.deleteBody", { name: productName })}
      confirmLabel={t("common.confirmDelete")}
      cancelLabel={t("common.cancel")}
      trigger={
        <button
          type="button"
          aria-label={t("common.delete")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      }
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("businessId", businessId);
        formData.set("productId", productId);
        await deleteProductAction(formData);
      }}
    />
  );
}