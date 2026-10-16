"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createProductAction, updateProductAction } from "@/app/actions/catalog";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";

export interface ProductFormValues {
  name: string;
  slug: string;
  category: string;
  description: string;
  price: string;
  currency: string;
  image: string;
  isActive: boolean;
  attachments: { url: string; alt: string; kind: string }[];
}

export function ProductForm({
  businessId,
  productId,
  values,
  categories,
}: {
  businessId: string;
  productId?: string;
  values: ProductFormValues;
  categories: string[];
}) {
  const { t } = useApp();
  const isEdit = Boolean(productId);
  const action = isEdit ? updateProductAction : createProductAction;

  const [state, formAction] = useActionState<ActionState, FormData>(action, {
    ok: false,
  });
  const [attachments, setAttachments] = useState(values.attachments);
  const [showForm, setShowForm] = useState(!isEdit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-foreground">
            {isEdit ? t("catalog.editTitle") : t("catalog.createTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("business.catalogSubtitle")}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? t("common.close") : isEdit ? t("common.edit") : t("business.addProduct")}
        </Button>
      </div>

      {showForm ? (
        <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <input type="hidden" name="businessId" value={businessId} />
          {productId ? <input type="hidden" name="productId" value={productId} /> : null}

          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
          {state.ok && state.message ? (
            <Alert tone="success">{state.message}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("catalog.productName")} htmlFor="name" required>
              <Input id="name" name="name" required defaultValue={values.name} placeholder={t("catalog.productNamePlaceholder")} />
            </Field>

            <Field
              label={t("catalog.category")}
              htmlFor="category"
              hint={categories.length ? categories.join(" · ") : undefined}
            >
              <Input
                id="category"
                name="category"
                defaultValue={values.category}
                list="catalog-categories"
                placeholder={t("catalog.categoryPlaceholder")}
              />
              <datalist id="catalog-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("catalog.price")} htmlFor="price" required>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={values.price || "0"}
              />
            </Field>
            <Field label={t("catalog.currency")} htmlFor="currency">
              <Input id="currency" name="currency" defaultValue={values.currency || "ETB"} />
            </Field>
            <Field
              label={t("catalog.slug")}
              htmlFor="slug"
              hint={t("catalog.slugHint")}
            >
              <Input id="slug" name="slug" defaultValue={values.slug} />
            </Field>
          </div>

          <Field
            label={t("catalog.imageUrl")}
            htmlFor="image"
            hint={t("catalog.imageUrlHint")}
          >
            <Input id="image" name="image" defaultValue={values.image} placeholder="https://" />
          </Field>

          <Field
            label={t("catalog.longDescription")}
            htmlFor="description"
            hint={t("catalog.longDescriptionPlaceholder")}
          >
            <Textarea id="description" name="description" rows={3} defaultValue={values.description} />
          </Field>

          <Checkbox
            name="isActive"
            label={t("catalog.active")}
            defaultChecked={values.isActive}
            className="pt-1"
          />

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("catalog.attachments")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("catalog.attachmentsHint")}
                </p>
              </div>
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={() =>
                  setAttachments((current) => [...current, { url: "", alt: "", kind: "image" }])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                {t("catalog.addAttachment")}
              </Button>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("catalog.noAttachments")}</p>
            ) : null}

            {attachments.map((attachment, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                <Input
                  name="attachmentUrl"
                  defaultValue={attachment.url}
                  placeholder={t("catalog.attachmentUrlPlaceholder")}
                />
                <Input name="attachmentAlt" defaultValue={attachment.alt} placeholder={t("catalog.attachmentAlt")} />
                <div className="flex items-center gap-2">
                  <Select name="attachmentKind" defaultValue={attachment.kind} className="h-10">
                    <option value="image">image</option>
                    <option value="file">file</option>
                    <option value="link">link</option>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("catalog.removeAttachment")}
                    onClick={() =>
                      setAttachments((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <SubmitButton pendingLabel={t("common.saving")}>
              {t("catalog.save")}
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}