"use client";

import {
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { FileUp, Paperclip, Plus, Trash2, X } from "lucide-react";

import { uploadFilesAction } from "@/app/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useApp } from "@/components/providers/app-provider";

export interface DetailRow {
  key: string;
  value: string;
}

export interface UploadRow {
  url: string;
  name: string;
  size: number;
  type: string;
}

/** A row with a trailing remove button, used by every editable table. */
export function RowShell({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove: () => void;
}) {
  const { t } = useApp();

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={t("common.remove")}
        className="text-muted-foreground hover:text-danger"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** `key` / `value` table with an "Add" button. */
export function DetailRowsEditor({
  rows,
  onChange,
}: {
  rows: DetailRow[];
  onChange: (rows: DetailRow[]) => void;
}) {
  const { t } = useApp();

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
      ) : null}

      {rows.map((row, index) => (
        <RowShell
          key={index}
          onRemove={() => onChange(rows.filter((_, i) => i !== index))}
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder={t("dashboard.detailKey")}
              value={row.key}
              onChange={(event) =>
                onChange(
                  rows.map((item, i) =>
                    i === index ? { ...item, key: event.target.value } : item,
                  ),
                )
              }
            />
            <Input
              placeholder={t("dashboard.detailValue")}
              value={row.value}
              onChange={(event) =>
                onChange(
                  rows.map((item, i) =>
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
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <Plus className="h-4 w-4" />
        {t("common.add")}
      </Button>
    </div>
  );
}

/** Single column rows (phone numbers, order form fields, ...). */
export function SimpleRowsEditor<T>({
  rows,
  onChange,
  create,
  renderRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  create: () => T;
  renderRow: (row: T, update: (row: T) => void) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <RowShell
          key={index}
          onRemove={() => onChange(rows.filter((_, i) => i !== index))}
        >
          {renderRow(row, (updated) =>
            onChange(rows.map((item, i) => (i === index ? updated : item))),
          )}
        </RowShell>
      ))}

      <Button
        type="button"
        variant="subtle"
        size="sm"
        onClick={() => onChange([...rows, create()])}
      >
        <Plus className="h-4 w-4" />
        <AddLabel />
      </Button>
    </div>
  );
}

function AddLabel() {
  const { t } = useApp();
  return <>{t("common.add")}</>;
}

/** Drag & drop / paste / click upload area. */
export function FileDropZone({
  files,
  onChange,
}: {
  files: UploadRow[];
  onChange: (files: UploadRow[]) => void;
}) {
  const { t } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function upload(list: FileList | File[]) {
    const selected = Array.from(list).filter((file) => file.size > 0);
    if (selected.length === 0) return;

    const formData = new FormData();
    for (const file of selected.slice(0, 10)) formData.append("files", file);

    setError(null);
    startUpload(async () => {
      try {
        const result = await uploadFilesAction(formData);
        if (!result.ok) {
          setError(result.error || "Upload failed.");
        } else {
          onChange([...files, ...result.files]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) upload(event.dataTransfer.files);
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = Array.from(event.clipboardData?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (pasted.length > 0) {
      event.preventDefault();
      upload(pasted);
    }
  }

  return (
    <div className="space-y-3">
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
        <p className="text-sm font-medium text-foreground">{t("dashboard.dropFiles")}</p>
        <p className="text-xs text-muted-foreground">{t("dashboard.pasteFiles")}</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {isPending ? (
        <p className="text-xs font-medium text-primary animate-pulse">
          Uploading files...
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {file.name || file.url.split("/").pop() || "Attachment"}
              </span>
              {file.size ? (
                <span className="text-xs text-muted-foreground">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("common.remove")}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="text-muted-foreground hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Section shell shared by the business and product forms. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export { Select };