"use client";

import { useActionState, useState } from "react";

import { updateBusinessAction } from "@/app/actions/businesses";
import {
  BusinessFormAlerts,
  BusinessFormFields,
  type BusinessFormValues,
} from "@/components/business/business-form-fields";
import { Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";

export function BusinessSettingsForm({
  businessId,
  values,
}: {
  businessId: string;
  values: BusinessFormValues;
}) {
  const { t } = useApp();
  const [isActive, setIsActive] = useState(values.isActive);
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBusinessAction,
    { ok: false },
  );

  return (
    <div className="space-y-4">
      <BusinessFormAlerts state={state} />

      <BusinessFormFields
        businessId={businessId}
        values={values}
        submit={formAction}
      >
        <div className="space-y-4">
          <input type="hidden" name="isActive" value={String(isActive)} />
          <Checkbox
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            label={t("catalog.active")}
          />

          <div className="flex justify-end">
            <SubmitButton pendingLabel={t("common.saving")}>
              {t("common.save")}
            </SubmitButton>
          </div>
        </div>
      </BusinessFormFields>
    </div>
  );
}
