"use client";

import { useActionState, useState } from "react";

import { updateBusinessAction } from "@/app/actions/businesses";
import {
  DetailRowsEditor,
  FileDropZone,
  FormSection,
  SimpleRowsEditor,
  type DetailRow,
  type UploadRow,
} from "@/components/business/form-blocks";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";
import type { OrderFormField } from "@/lib/models";

export interface BusinessFormValues {
  name: string;
  details: DetailRow[];
  orderForms: { name: string; type: OrderFormField["type"] }[];
  contacts: { phone: string }[];
  files: UploadRow[];
  image: string;
  isActive: boolean;
}

const ORDER_FORM_TYPES: OrderFormField["type"][] = [
  "text",
  "textarea",
  "tel",
  "email",
  "select",
];

/**
 * Business details form shared by the settings tab.
 *
 * The tables are serialised into hidden inputs so the form submits through a
 * plain server action (works with and without JavaScript).
 */
export function BusinessSettingsForm({
  businessId,
  values,
}: {
  businessId: string;
  values: BusinessFormValues;
}) {
  const { t } = useApp();
  const [details, setDetails] = useState<DetailRow[]>(values.details);
  const [orderForms, setOrderForms] = useState(values.orderForms);
  const [contacts, setContacts] = useState(values.contacts);
  const [files, setFiles] = useState<UploadRow[]>(values.files);
  const [isActive, setIsActive] = useState(values.isActive);

  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBusinessAction,
    { ok: false },
  );

  const image = files.find((file) => file.type === "image")?.url ?? values.image;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="details" value={JSON.stringify(details)} readOnly />
      <input
        type="hidden"
        name="orderForms"
        value={JSON.stringify(orderForms)}
        readOnly
      />
      <input
        type="hidden"
        name="contacts"
        value={JSON.stringify(contacts)}
        readOnly
      />
      <input type="hidden" name="files" value={JSON.stringify(files)} readOnly />
      <input type="hidden" name="image" value={image} readOnly />
      <input type="hidden" name="isActive" value={String(isActive)} readOnly />

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-success"
        >
          {state.message}
        </p>
      ) : null}

      <FormSection title={t("dashboard.businessName")}>
        <Field label={t("dashboard.businessName")} htmlFor="business-name" required>
          <Input
            id="business-name"
            name="name"
            required
            defaultValue={values.name}
            placeholder={t("dashboard.businessNamePlaceholder")}
          />
        </Field>
        <Checkbox
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          label={t("catalog.active")}
        />
      </FormSection>

      <FormSection title={t("dashboard.details")} description={t("dashboard.detailsHint")}>
        <DetailRowsEditor rows={details} onChange={setDetails} />
      </FormSection>

      <FormSection
        title={t("dashboard.orderForms")}
        description={t("settings.orderFormHint")}
      >
        <SimpleRowsEditor
          rows={orderForms}
          onChange={setOrderForms}
          create={() => ({ name: "", type: "text" as const })}
          renderRow={(row, update) => (
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={t("settings.fieldLabel")}
                value={row.name}
                onChange={(event) => update({ ...row, name: event.target.value })}
              />
              <Select
                value={row.type}
                onChange={(event) =>
                  update({
                    ...row,
                    type: event.target.value as typeof row.type,
                  })
                }
              >
                {ORDER_FORM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title={t("dashboard.contactPersons")}
        description={t("dashboard.contactPhonesHint")}
      >
        <SimpleRowsEditor
          rows={contacts}
          onChange={setContacts}
          create={() => ({ phone: "" as string })}
          renderRow={(row, update) => (
            <Input
              placeholder={t("dashboard.phonePlaceholder")}
              value={row.phone}
              onChange={(event) => update({ phone: event.target.value })}
            />
          )}
        />
      </FormSection>

      <FormSection
        title={t("dashboard.uploadFiles")}
        description={t("dashboard.uploadHint")}
      >
        <FileDropZone files={files} onChange={setFiles} />
      </FormSection>

      <div className="flex justify-end">
        <SubmitButton pendingLabel={t("common.saving")}>{t("common.save")}</SubmitButton>
      </div>
    </form>
  );
}