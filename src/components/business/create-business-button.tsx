"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { createBusinessAction } from "@/app/actions/businesses";
import {
  BusinessFormFields,
  BusinessFormAlerts,
  type BusinessFormValues,
} from "@/components/business/business-form-fields";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";

const EMPTY_VALUES: BusinessFormValues = {
  name: "",
  details: [],
  orderForms: [],
  contacts: [],
  files: [],
  image: "",
  isActive: true,
};

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
        title={t("dashboard.createTitle")}
        size="lg"
      >
        {reachedLimit ? (
          <Alert tone="warning" className="mb-4">
            {t("dashboard.limitReached", { max: max ?? 0 })}
          </Alert>
        ) : null}

        <div className="space-y-4">
          <BusinessFormAlerts state={state} />

          <BusinessFormFields values={EMPTY_VALUES} submit={formAction}>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <SubmitButton pendingLabel={t("common.saving")}>
                {t("dashboard.createAction")}
              </SubmitButton>
            </div>
          </BusinessFormFields>
        </div>
      </Modal>
    </>
  );
}