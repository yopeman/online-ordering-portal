"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteBusinessAction } from "@/app/actions/businesses";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { useApp } from "@/components/providers/app-provider";

export function DeleteBusinessCard({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const { t } = useApp();
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirmation === businessName;

  function handleDelete() {
    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("confirmation", confirmation);

    startTransition(async () => {
      await deleteBusinessAction(formData);
    });
  }

  return (
    <Card className="border-danger/40">
      <CardHeader title={t("settings.dangerZone")} description={t("settings.dangerBody")} />

      <CardBody className="space-y-4">
        <Alert tone="danger">{t("business.dangerZoneHint")}</Alert>

        <div className="space-y-4">
          <Field
            label={t("settings.deleteConfirmLabel")}
            htmlFor="confirmation"
            hint={businessName}
          >
            <Input
              id="confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={businessName}
              autoComplete="off"
            />
          </Field>

          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={!matches || pending}
              loading={pending}
            >
              <Trash2 className="h-4 w-4" />
              {t("settings.deleteBusiness")}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}