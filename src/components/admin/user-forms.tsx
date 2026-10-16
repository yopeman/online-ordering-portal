"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createUserAction, deleteUserAction, updateUserAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";
import type { UserListItem } from "@/lib/admin-queries";

export interface UserFormValues {
  name: string;
  email: string;
  role: string;
  status: string;
  maxBusinesses: string;
  maxCatalogs: string;
}

const EMPTY: UserFormValues = {
  name: "",
  email: "",
  role: "business_owner",
  status: "active",
  maxBusinesses: "3",
  maxCatalogs: "50",
};

export function UserFormFields({
  values,
  hideEmail = false,
}: {
  values: UserFormValues;
  hideEmail?: boolean;
}) {
  const { t } = useApp();

  return (
    <div className="space-y-4">
      <Field label={t("admin.userName")} htmlFor="name" required>
        <Input id="name" name="name" required defaultValue={values.name} />
      </Field>

      {hideEmail ? null : (
        <Field label={t("admin.userEmail")} htmlFor="email" required>
          <Input id="email" name="email" type="email" required defaultValue={values.email} />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.userRole")} htmlFor="role">
          <Select id="role" name="role" defaultValue={values.role}>
            <option value="business_owner">{t("admin.ownerRole")}</option>
            <option value="admin">{t("admin.adminRole")}</option>
          </Select>
        </Field>
        <Field label={t("admin.userStatus")} htmlFor="status">
          <Select id="status" name="status" defaultValue={values.status}>
            <option value="active">{t("admin.active")}</option>
            <option value="inactive">{t("admin.inactive")}</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.maxBusinesses")}
          htmlFor="maxBusinesses"
          hint={t("admin.maxHint")}
        >
          <Input
            id="maxBusinesses"
            name="maxBusinesses"
            type="number"
            min={1}
            max={1000}
            required
            defaultValue={values.maxBusinesses}
          />
        </Field>
        <Field
          label={t("admin.maxCatalogs")}
          htmlFor="maxCatalogs"
          hint={t("admin.maxHint")}
        >
          <Input
            id="maxCatalogs"
            name="maxCatalogs"
            type="number"
            min={1}
            max={1000}
            required
            defaultValue={values.maxCatalogs}
          />
        </Field>
      </div>
    </div>
  );
}

export function CreateUserButton() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    createUserAction,
    { ok: false },
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("admin.createUser")}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("admin.createUser")}>
        <form action={formAction} className="space-y-4">
          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
          {state.ok && state.message ? (
            <Alert tone="success">{state.message}</Alert>
          ) : null}

          <UserFormFields values={EMPTY} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <SubmitButton pendingLabel={t("common.saving")}>{t("common.create")}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditUserButton({ user }: { user: UserListItem }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateUserAction,
    { ok: false },
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
      >
        {t("common.edit")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("admin.editUser")}
        description={user.email}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
          {state.ok && state.message ? (
            <Alert tone="success">{state.message}</Alert>
          ) : null}

          <UserFormFields
            hideEmail
            values={{
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              maxBusinesses: String(user.maxBusinesses),
              maxCatalogs: String(user.maxCatalogs),
            }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <SubmitButton pendingLabel={t("common.saving")}>{t("common.save")}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteUserButton({
  user,
  isSelf,
}: {
  user: UserListItem;
  isSelf: boolean;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isSelf}
        title={isSelf ? t("admin.deleteSelf") : t("admin.deleteUser")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("admin.deleteUser")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <form action={deleteUserAction}>
              <input type="hidden" name="userId" value={user.id} />
              <SubmitButton variant="danger" pendingLabel={t("common.loading")}>
                {t("common.confirmDelete")}
              </SubmitButton>
            </form>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("admin.deleteUserBody")}</p>
      </Modal>
    </>
  );
}
