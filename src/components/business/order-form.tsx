"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Phone, ShoppingCart } from "lucide-react";

import { placeOrderAction } from "@/app/actions/orders";
import { Alert } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import { formatPrice } from "@/lib/i18n/config";
import type { OrderFormField } from "@/lib/models";

export interface OrderFormFieldDTO {
  key: string;
  label: string;
  type: OrderFormField["type"];
  required: boolean;
  placeholder: string;
  options: string[];
}

export function OrderForm({
  slug,
  fields,
  contactPhones,
  price,
  currency,
}: {
  slug: string;
  fields: OrderFormFieldDTO[];
  /** `contactPhones` of the business (schema: Businesses.contact phones). */
  contactPhones: string[];
  price: number;
  currency: string;
}) {
  const { t, locale } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [state, formAction] = useActionState(placeOrderAction, { ok: false });

  // Reset the quantity once per successful submission. Adjusting state during
  // render (instead of in an effect) avoids an extra cascading render.
  const [lastResultOk, setLastResultOk] = useState(false);
  if (state.ok !== lastResultOk) {
    setLastResultOk(state.ok);
    if (state.ok) setQuantity(1);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      {state.ok ? (
        <Alert tone="success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {state.message}
          </span>
        </Alert>
      ) : null}
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field label={t("product.quantity")} htmlFor="quantity" required>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={100}
          value={quantity}
          onChange={(event) =>
            setQuantity(
              Math.min(100, Math.max(1, Number(event.target.value) || 1)),
            )
          }
          inputMode="numeric"
        />
      </Field>

      {/* ----------------------------- Your details ---------------------------- */}
      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">
          {t("product.yourDetails")}
        </h3>

        {/* Contact numbers of the business (Business.contactPhones). */}
        {contactPhones.length > 0 ? (
          <div className="space-y-2">
            <Field
              label={t("product.contactNumber")}
              htmlFor="contactPhone"
              hint={t("product.contactHint")}
            >
              <Select
                id="contactPhone"
                name="contactPhone"
                defaultValue={contactPhones[0]}
              >
                {contactPhones.map((phone) => (
                  <option key={phone} value={phone}>
                    {phone}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex flex-wrap gap-2">
              {contactPhones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {t("product.callBusiness")}: {phone}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Order form template configured by the business. */}
        {fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            htmlFor={`field_${field.key}`}
            required={field.required}
            hint={field.placeholder || undefined}
          >
            {field.type === "textarea" ? (
              <Textarea
                id={`field_${field.key}`}
                name={`field_${field.key}`}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <Select
                id={`field_${field.key}`}
                name={`field_${field.key}`}
                required={field.required}
                defaultValue=""
              >
                <option value="">{t("common.select")}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={`field_${field.key}`}
                name={`field_${field.key}`}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </Field>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          {t("common.total")}{" "}
          <span className="font-semibold text-foreground">
            {formatPrice(price * quantity, locale, currency)}
          </span>
        </p>
        <SubmitButton pendingLabel={t("common.submitting")}>
          <ShoppingCart className="h-4 w-4" />
          {t("product.orderNow")}
        </SubmitButton>
      </div>
    </form>
  );
}
