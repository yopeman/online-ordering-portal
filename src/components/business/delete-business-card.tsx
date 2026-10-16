"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteBusinessAction } from "@/app/actions/businesses";
import { Alert } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
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
  const matches = confirmation === businessName;

  return (
    <Card className="border-danger/40">
      <CardHeader title={t("settings.dangerZone")} description={t("settings.dangerBody")} />

      <CardBody className="space-y-4">
        <Alert tone="danger">{t("business.dangerZoneHint")}</Alert>

        <form action={deleteBusinessAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

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
            <SubmitButton
              variant="danger"
              pendingLabel={t("common.loading")}
              disabled={!matches}
            >
              <Trash2 className="h-4 w-4" />
              {t("settings.deleteBusiness")}
            </SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}