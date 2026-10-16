"use client";

import {
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { FileUp, Paperclip, Plus, Trash2, X } from "lucide-react";

import { uploadFilesAction } from "@/app/actions/uploads";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { useApp } from "@/components/providers/app-provider";
import type { ActionState } from "@/app/actions/businesses";
import type { OrderFormField } from "@/lib/models";

export interface DetailRow {
  key: string;
  value: string;
}

export interface OrderFormRow {
  name: string;
  type: OrderFormField["type"];
}

export interface ContactRow {
  phone: string;
}

export interface UploadRow {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface BusinessFormValues {
  name: string;
  details: DetailRow[];
  orderForms: OrderFormRow[];
  contacts: ContactRow[];
  files: UploadRow[];
  image: string;
  isActive: boolean;
}

const ORDER_FORM_TYPES: OrderFormField["type"][] = [
  "text",
  "textarea",
  "tel",
  "email",
  "select",
];

function RowShell({
  children,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={removeLabel}
        className="text-muted-foreground hover:text-danger"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function BusinessFormFields({
  businessId,
  values,
  submit,
  children,
}: {
  businessId?: string;
  values: BusinessFormValues;
  submit: (formData: FormData) => void | Promise<void>;
  children?: React.ReactNode;
}) {
  const { t } = useApp();

  const [details, setDetails] = useState<DetailRow[]>(values.details);
  const [orderForms, setOrderForms] = useState<OrderFormRow[]>(values.orderForms);
  const [contacts, setContacts] = useState<ContactRow[]>(values.contacts);
  const [files, setFiles] = useState<UploadRow[]>(values.files);

  const [isDragging, setIsDragging] = useState(false);
  const [, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(list: FileList | File[]) {
    const filesToSend = Array.from(list).filter((file) => file.size > 0);
    if (filesToSend.length === 0) return;

    const formData = new FormData();
    for (const file of filesToSend.slice(0, 10)) formData.append("files", file);

    startUpload(async () => {
      const result = await uploadFilesAction(formData);
      setFiles((current) => [...current, ...result.files]);
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) uploadFiles(event.dataTransfer.files);
  }

  /** Supports pasting an image straight from the clipboard / screenshot tool. */
  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = Array.from(event.clipboardData?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (pasted.length > 0) {
      event.preventDefault();
      uploadFiles(pasted);
    }
  }

  const image = files.find((file) => file.type === "image")?.url ?? values.image;

  return (
    <form action={submit} className="space-y-4">
      {businessId ? (
        <input type="hidden" name="businessId" value={businessId} />
      ) : null}
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

      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title={t("dashboard.businessName")}
          description={t("catalog.slugHint")}
        />
        <CardBody>
          <Field label={t("dashboard.businessName")} htmlFor="business-name" required>
            <Input
              id="business-name"
              name="name"
              required
              defaultValue={values.name}
              placeholder={t("dashboard.businessNamePlaceholder")}
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader title={t("dashboard.details")} description={t("dashboard.detailsHint")} />
        <CardBody className="space-y-3">
          {details.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
          ) : null}

          {details.map((row, index) => (
            <RowShell
              key={index}
              removeLabel={t("common.remove")}
              onRemove={() =>
                setDetails((current) => current.filter((_, i) => i !== index))
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder={t("dashboard.detailKey")}
                  value={row.key}
                  onChange={(event) =>
                    setDetails((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, key: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Input
                  placeholder={t("dashboard.detailValue")}
                  value={row.value}
                  onChange={(event) =>
                    setDetails((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, value: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
            </RowShell>
          ))}

          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => setDetails((current) => [...current, { key: "", value: "" }])}
          >
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title={t("dashboard.orderForms")}
          description={t("settings.orderFormHint")}
        />
        <CardBody className="space-y-3">
          {orderForms.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("settings.noFields")}</p>
          ) : null}

          {orderForms.map((row, index) => (
            <RowShell
              key={index}
              removeLabel={t("common.remove")}
              onRemove={() =>
                setOrderForms((current) => current.filter((_, i) => i !== index))
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder={t("settings.fieldLabel")}
                  value={row.name}
                  onChange={(event) =>
                    setOrderForms((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Select
                  value={row.type}
                  onChange={(event) =>
                    setOrderForms((current) =>
                      current.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              type: event.target.value as OrderFormField["type"],
                            }
                          : item,
                      ),
                    )
                  }
                >
                  {ORDER_FORM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
            </RowShell>
          ))}

          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() =>
              setOrderForms((current) => [...current, { name: "", type: "text" }])
            }
          >
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title={t("dashboard.contactPersons")}
          description={t("dashboard.contactPhonesHint")}
        />
        <CardBody className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
          ) : null}

          {contacts.map((row, index) => (
            <RowShell
              key={index}
              removeLabel={t("common.remove")}
              onRemove={() =>
                setContacts((current) => current.filter((_, i) => i !== index))
              }
            >
              <Input
                placeholder={t("dashboard.phonePlaceholder")}
                value={row.phone}
                onChange={(event) =>
                  setContacts((current) =>
                    current.map((item, i) =>
                      i === index ? { phone: event.target.value } : item,
                    ),
                  )
                }
              />
            </RowShell>
          ))}

          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => setContacts((current) => [...current, { phone: "" }])}
          >
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title={t("dashboard.uploadFiles")}
          description={t("dashboard.uploadHint")}
        />
        <CardBody className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onPaste={onPaste}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary-soft"
                : "border-border hover:border-primary-border hover:bg-surface-muted"
            }`}
          >
            <FileUp className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("dashboard.dropFiles")}
            </p>
            <p className="text-xs text-muted-foreground">{t("dashboard.pasteFiles")}</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.url}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("common.remove")}
                    onClick={() =>
                      setFiles((current) => current.filter((_, i) => i !== index))
                    }
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      {children}
    </form>
  );
}

/** Small helper so pages can share the action-result alert rendering. */
export function BusinessFormAlerts({ state }: { state: ActionState }) {
  if (state.error) return <Alert tone="danger">{state.error}</Alert>;
  if (state.ok && state.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}