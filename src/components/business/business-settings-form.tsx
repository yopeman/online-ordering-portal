"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { updateBusinessAction } from "@/app/actions/businesses";
import {
  DetailRowsEditor,
  FileDropZone,
  FormSection,
  SelectOptionsEditor,
  SimpleRowsEditor,
  type DetailRow,
  type UploadRow,
} from "@/components/business/form-blocks";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";
import type { BusinessContact, BusinessContactType, OrderFormField } from "@/lib/models";

export interface OrderFormRow {
  name: string;
  type: OrderFormField["type"];
  options?: string[];
}

export interface BusinessFormValues {
  name: string;
  details: DetailRow[];
  orderForms: OrderFormRow[];
  contacts: BusinessContact[];
  files: UploadRow[];
  image: string;
  status?: "visible" | "hide";
  isActive?: boolean;
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
  const router = useRouter();
  const { t } = useApp();
  const [name, setName] = useState(values.name);
  const [details, setDetails] = useState<DetailRow[]>(values.details);
  const [orderForms, setOrderForms] = useState(values.orderForms);
  const [contacts, setContacts] = useState(values.contacts);
  const [files, setFiles] = useState<UploadRow[]>(values.files);
  const initialStatus: "visible" | "hide" =
    values.status ?? (values.isActive !== false ? "visible" : "hide");
  const [status, setStatus] = useState<"visible" | "hide">(initialStatus);

  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBusinessAction,
    { ok: false },
  );

  // Sync internal form state when updated values arrive from the server
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    setName(values.name);
    setDetails(values.details);
    setOrderForms(values.orderForms);
    setContacts(values.contacts);
    setFiles(values.files);
    setStatus(values.status ?? (values.isActive !== false ? "visible" : "hide"));
  }, [values.name, values.status, values.isActive, values.image]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Refresh server components (e.g. business layout header & badge) when save succeeds
  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

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
      <input type="hidden" name="status" value={status} readOnly />
      <input type="hidden" name="isActive" value={String(status === "visible")} readOnly />

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
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("dashboard.businessNamePlaceholder")}
          />
        </Field>

        <Field
          label={t("common.status")}
          htmlFor="business-status"
          hint={
            status === "visible"
              ? t("dashboard.statusVisibleHint")
              : t("dashboard.statusHideHint")
          }
        >
          <div className="pt-1">
            <Checkbox
              id="business-status"
              checked={status === "visible"}
              onChange={(event) =>
                setStatus(event.target.checked ? "visible" : "hide")
              }
              label={t("dashboard.visible")}
            />
          </div>
        </Field>
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
          create={() => ({ name: "", type: "text" as const, options: [] })}
          renderRow={(row, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder={t("settings.fieldLabel")}
                  value={row.name}
                  onChange={(event) => update({ ...row, name: event.target.value })}
                />
                <Select
                  value={row.type}
                  onChange={(event) => {
                    const nextType = event.target.value as typeof row.type;
                    update({
                      ...row,
                      type: nextType,
                      options:
                        nextType === "select"
                          ? row.options && row.options.length > 0
                            ? row.options
                            : [""]
                          : row.options,
                    });
                  }}
                >
                  {ORDER_FORM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              {row.type === "select" ? (
                <SelectOptionsEditor
                  options={row.options}
                  onChange={(options) => update({ ...row, options })}
                />
              ) : null}
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
          create={() => ({ type: "sms", target: "" })}
          renderRow={(row, update) => (
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
              <Select
                value={row.type || "sms"}
                onChange={(event) =>
                  update({ ...row, type: event.target.value as BusinessContactType })
                }
              >
                <option value="sms">{t("dashboard.contactTypeSms") || "SMS / Phone"}</option>
                <option value="telegram">{t("dashboard.contactTypeTelegram") || "Telegram"}</option>
                <option value="wa">{t("dashboard.contactTypeWhatsApp") || "WhatsApp"}</option>
                <option value="email">{t("dashboard.contactTypeEmail") || "Email"}</option>
              </Select>
              <Input
                placeholder={
                  row.type === "email"
                    ? "name@example.com"
                    : row.type === "telegram"
                      ? "@channel or link"
                      : row.type === "wa"
                        ? "+251... or link"
                        : t("dashboard.phonePlaceholder")
                }
                value={row.target}
                onChange={(event) => update({ ...row, target: event.target.value })}
              />
            </div>
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