"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  DetailRowsEditor,
  FileDropZone,
  FormSection,
  type DetailRow,
  type UploadRow,
} from "@/components/business/form-blocks";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";

export interface ProductFormValues {
  id?: string;
  name: string;
  category: string;
  details: DetailRow[];
  files: UploadRow[];
  image?: string;
  price: string;
  currency: string;
  isActive: boolean;
}

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  category: "",
  details: [],
  files: [],
  image: "",
  price: "",
  currency: "ETB",
  isActive: true,
};

/**
 * New product / edit product modal.
 *
 * Serialises the tables into hidden inputs so the form works with a plain
 * server action submit (and still works without JavaScript).
 */
export function ProductFormModal(props: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  values: ProductFormValues;
  categories?: string[];
  busy?: boolean;
  error?: string;
}) {
  if (!props.open) return null;

  return <ProductFormDialog key={props.values.id ?? "new"} {...props} />;
}

function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  values,
  categories = [],
  busy,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  values: ProductFormValues;
  categories?: string[];
  busy?: boolean;
  error?: string;
}) {
  const { t } = useApp();
  const isInitialCustom =
    Boolean(values.category) && !categories.includes(values.category);
  const initialMode =
    categories.length === 0
      ? "__new__"
      : isInitialCustom
        ? "__new__"
        : values.category || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialMode);
  const [customCategory, setCustomCategory] = useState<string>(
    isInitialCustom ? values.category : "",
  );
  const isCreatingNew =
    selectedCategory === "__new__" || categories.length === 0;
  const finalCategory = isCreatingNew
    ? customCategory.trim()
    : selectedCategory.trim();

  const [details, setDetails] = useState<DetailRow[]>(values.details);
  const [files, setFiles] = useState<UploadRow[]>(values.files);
  const [isActive, setIsActive] = useState(values.isActive);

  const image = files.find((file) => file.type === "image")?.url ?? values.image ?? "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={values.id ? t("catalog.editTitle") : t("catalog.createTitle")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <SubmitButton type="submit" form="product-form" pendingLabel={t("common.saving")} busy={busy}>
            {t("catalog.save")}
          </SubmitButton>
        </>
      }
    >
      <form id="product-form" action={onSubmit} className="space-y-4">
        {values.id ? <input type="hidden" name="productId" value={values.id} /> : null}
        <input type="hidden" name="category" value={finalCategory} />
        <input type="hidden" name="details" value={JSON.stringify(details)} readOnly />
        <input type="hidden" name="files" value={JSON.stringify(files)} readOnly />
        <input type="hidden" name="image" value={image} readOnly />
        <input type="hidden" name="isActive" value={String(isActive)} readOnly />

        {error ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <FormSection title={""}>
          <Field label={t("catalog.productName")} htmlFor="product-name" required>
            <Input
              id="product-name"
              name="name"
              required
              defaultValue={values.name}
              placeholder={t("catalog.productNamePlaceholder")}
            />
          </Field>
        </FormSection>

        <FormSection title={t("catalog.category")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Field
                label={t("catalog.category")}
                htmlFor={
                  categories.length > 0
                    ? "product-category-select"
                    : "product-custom-category"
                }
              >
                {categories.length > 0 ? (
                  <Select
                    id="product-category-select"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  >
                    <option value="">{t("catalog.selectCategory")}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__new__">{t("catalog.createNewCategory")}</option>
                  </Select>
                ) : null}

                {isCreatingNew ? (
                  <div className={categories.length > 0 ? "pt-2" : ""}>
                    {categories.length > 0 ? (
                      <label
                        htmlFor="product-custom-category"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        {t("catalog.newCategoryLabel")}
                      </label>
                    ) : null}
                    <Input
                      id="product-custom-category"
                      value={customCategory}
                      onChange={(event) => setCustomCategory(event.target.value)}
                      placeholder={t("catalog.categoryPlaceholder")}
                      autoFocus={selectedCategory === "__new__" && categories.length > 0}
                    />
                  </div>
                ) : null}
              </Field>
            </div>

            <Field label={t("catalog.price")} htmlFor="product-price">
              <Input
                id="product-price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={values.price || "0"}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("catalog.currency")} htmlFor="product-currency">
              <Input
                id="product-currency"
                name="currency"
                defaultValue={values.currency || "ETB"}
              />
            </Field>
            <div className="flex items-end pb-1 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                {t("catalog.active")}
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection title={t("dashboard.details")} description={t("dashboard.detailsHint")}>
          <DetailRowsEditor rows={details} onChange={setDetails} />
        </FormSection>

        <FormSection title={t("dashboard.uploadFiles")} description={t("dashboard.uploadHint")}>
          <FileDropZone files={files} onChange={setFiles} />
        </FormSection>
      </form>
    </Modal>
  );
}

/** "Add product" button that opens the modal. */
export function NewProductButton({
  disabled,
  onOpen,
}: {
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { t } = useApp();

  return (
    <Button onClick={onOpen} disabled={disabled}>
      <Plus className="h-4 w-4" />
      {t("business.addProduct")}
    </Button>
  );
}
