"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { updateBusinessAction } from "@/app/actions/businesses";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { OrderFormField } from "@/lib/models";
import type { ActionState } from "@/app/actions/businesses";

const FIELD_TYPES: OrderFormField["type"][] = [
  "text",
  "textarea",
  "tel",
  "email",
  "select",
];

export function BusinessSettingsForm({
  businessId,
  values,
  orderFormTemplates,
}: {
  businessId: string;
  values: {
    name: string;
    description: string;
    category: string;
    location: string;
    image: string;
    isActive: boolean;
    contactPhones: string[];
  };
  orderFormTemplates: OrderFormField[];
}) {
  const { t } = useApp();
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBusinessAction,
    { ok: false },
  );
  const [fields, setFields] = useState<OrderFormField[]>(orderFormTemplates);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input
        type="hidden"
        name="orderFormTemplates"
        value={JSON.stringify(fields)}
        readOnly
      />

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.ok && state.message ? (
        <Alert tone="success">{state.message}</Alert>
      ) : null}

      <Card>
        <CardHeader title={t("settings.general")} description={t("settings.generalHint")} />
        <CardBody className="space-y-4">
          <Field label={t("dashboard.businessName")} htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={values.name} />
          </Field>

          <Field label={t("dashboard.description")} htmlFor="description">
            <Textarea id="description" name="description" rows={3} defaultValue={values.description} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("dashboard.category")} htmlFor="category">
              <Input id="category" name="category" defaultValue={values.category} />
            </Field>
            <Field label={t("dashboard.location")} htmlFor="location">
              <Input id="location" name="location" defaultValue={values.location} />
            </Field>
          </div>

          <Field
            label={t("dashboard.contactPhones")}
            htmlFor="contactPhones"
            hint={t("dashboard.contactPhonesHint")}
          >
            <Textarea
              id="contactPhones"
              name="contactPhones"
              rows={2}
              defaultValue={values.contactPhones.join("\n")}
            />
          </Field>

          <Field
            label={t("catalog.imageUrl")}
            htmlFor="image"
            hint={t("catalog.imageUrlHint")}
          >
            <Input id="image" name="image" defaultValue={values.image} placeholder="https://" />
          </Field>

          <Checkbox
            name="isActive"
            label={t("catalog.active")}
            defaultChecked={values.isActive}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("settings.orderForm")} description={t("settings.orderFormHint")} />

        <CardBody className="space-y-4">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("settings.noFields")}</p>
          ) : null}

          {fields.map((field, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-border p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("settings.fieldLabel")} htmlFor={`label_${index}`} required>
                  <Input
                    id={`label_${index}`}
                    name={`fieldLabel_${index}`}
                    defaultValue={field.label}
                    required
                  />
                </Field>
                <Field
                  label={t("settings.fieldKey")}
                  htmlFor={`key_${index}`}
                  hint={t("settings.fieldKeyHint")}
                >
                  <Input
                    id={`key_${index}`}
                    name={`fieldKey_${index}`}
                    defaultValue={field.key}
                    placeholder={`field_${index + 1}`}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("settings.fieldType")} htmlFor={`type_${index}`}>
                  <Select id={`type_${index}`} name={`fieldType_${index}`} defaultValue={field.type}>
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>

                {field.type === "select" ? (
                  <Field
                    label={t("settings.fieldOptions")}
                    htmlFor={`options_${index}`}
                    hint={t("settings.fieldOptionsHint")}
                  >
                    <Textarea
                      id={`options_${index}`}
                      name={`fieldOptions_${index}`}
                      rows={2}
                      defaultValue={(field.options ?? []).join("\n")}
                    />
                  </Field>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name={`fieldRequired_${index}`}
                    defaultChecked={Boolean(field.required)}
                    className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                  />
                  {t("settings.fieldRequired")}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFields((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  {t("settings.removeField")}
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() =>
              setFields((current) => [
                ...current,
                { key: `field_${current.length + 1}`, label: "", type: "text", required: false },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            {t("settings.addField")}
          </Button>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pendingLabel={t("common.saving")}>{t("common.save")}</SubmitButton>
      </div>
    </form>
  );
}