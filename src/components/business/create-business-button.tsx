"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { createBusinessAction } from "@/app/actions/businesses";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";

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
  const [state, formAction] = useActionState(createBusinessAction, { ok: false });

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        disabled={!canCreate}
      >
        <Plus className="h-4 w-4" />
        {label ?? t("dashboard.create")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("dashboard.createTitle")}
        footer={null}
      >
        {reachedLimit ? (
          <Alert tone="warning" className="mb-4">
            {t("dashboard.limitReached", { max: max ?? 0 })}
          </Alert>
        ) : null}

        <form action={formAction} className="space-y-4">
          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

          <Field label={t("dashboard.businessName")} htmlFor="name" required>
            <Input id="name" name="name" required placeholder={t("dashboard.businessNamePlaceholder")} />
          </Field>

          <Field label={t("dashboard.description")} htmlFor="description">
            <Textarea id="description" name="description" rows={3} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("dashboard.category")} htmlFor="category">
              <Input id="category" name="category" placeholder={t("dashboard.categoryPlaceholder")} />
            </Field>
            <Field label={t("dashboard.location")} htmlFor="location">
              <Input id="location" name="location" placeholder={t("dashboard.locationPlaceholder")} />
            </Field>
          </div>

          <Field
            label={t("dashboard.contactPhones")}
            htmlFor="contactPhones"
            hint={t("dashboard.contactPhonesHint")}
          >
            <Textarea id="contactPhones" name="contactPhones" rows={2} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <SubmitButton pendingLabel={t("common.saving")}>
              {t("dashboard.createAction")}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}