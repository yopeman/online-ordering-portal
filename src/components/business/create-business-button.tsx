"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { createBusinessAction } from "@/app/actions/businesses";
import {
  DetailRowsEditor,
  FileDropZone,
  FormSection,
  SelectOptionsEditor,
  SimpleRowsEditor,
  type UploadRow,
} from "@/components/business/form-blocks";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";
import type { BusinessContact, BusinessContactType, OrderFormField } from "@/lib/models";

const ORDER_FORM_TYPES: OrderFormField["type"][] = [
  "text",
  "textarea",
  "tel",
  "email",
  "select",
];

/** "Create business" button + modal with the five sections. */
export function CreateBusinessButton({
  canCreate,
  reachedLimit,
  label,
  max,
  variant = "primary",
}: {
  canCreate: boolean;
  reachedLimit: boolean;
  label?: string;
  max?: number;
  variant?: "primary" | "secondary";
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  const [details, setDetails] = useState([{ key: "", value: "" }]);
  const [orderForms, setOrderForms] = useState<
    { name: string; type: OrderFormField["type"]; options?: string[] }[]
  >([]);
  const [contacts, setContacts] = useState<BusinessContact[]>([{ type: "sms", target: "" }]);
  const [files, setFiles] = useState<UploadRow[]>([]);

  const [state, formAction] = useActionState<ActionState, FormData>(
    createBusinessAction,
    { ok: false },
  );

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} disabled={!canCreate}>
        <Plus className="h-4 w-4" />
        {label ?? t("dashboard.create")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={t("dashboard.createTitle")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <SubmitButton
              form="create-business-form"
              pendingLabel={t("common.saving")}
            >
              {t("dashboard.createAction")}
            </SubmitButton>
          </>
        }
      >
        {reachedLimit ? (
          <Alert tone="warning" className="mb-4">
            {t("dashboard.limitReached", { max: max ?? 0 })}
          </Alert>
        ) : null}

        <form id="create-business-form" action={formAction} className="space-y-4">
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

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <FormSection title={t("dashboard.businessName")}>
            <Field label={t("dashboard.businessName")} htmlFor="new-business-name" required>
              <Input
                id="new-business-name"
                name="name"
                required
                placeholder={t("dashboard.businessNamePlaceholder")}
              />
            </Field>
          </FormSection>

          <FormSection
            title={t("dashboard.details")}
            description={t("dashboard.detailsHint")}
          >
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
                      update({
                        ...row,
                        type: event.target.value as BusinessContactType,
                      })
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
        </form>
      </Modal>
    </>
  );
}