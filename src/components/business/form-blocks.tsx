"use client";

import {
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { FileUp, Loader2, Paperclip, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useApp } from "@/components/providers/app-provider";
import { uploadFilesAction } from "@/app/actions/uploads";

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

/** Drag & drop / paste / click upload area with cloud storage support. */
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

    setError(null);
    startUpload(async () => {
      try {
        const formData = new FormData();
        for (const file of selected.slice(0, 10)) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("Files must be smaller than 10 MB.");
          }
          formData.append("files", file);
        }

        const res = await uploadFilesAction(formData);
        if (!res.ok) {
          throw new Error(res.error || "Upload failed.");
        }

        const newRows: UploadRow[] = res.files.map((file) => ({
          url: file.url,
          name: file.name,
          size: file.size,
          type: file.type === "file" ? "file" : "image",
        }));

        onChange([...files, ...newRows]);
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
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading files...
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const isImg = file.type === "image" || file.url.startsWith("data:image/");
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-surface"
              >
                {isImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name || "Attachment"}
                  </p>
                  {file.size ? (
                    <p className="text-xs text-muted-foreground">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </p>
                  ) : null}
                </div>
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
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Single select field options editor: accepts options with an option input and "+ Add" button */
export function SelectOptionsEditor({
  options = [],
  onChange,
}: {
  options?: string[];
  onChange: (options: string[]) => void;
}) {
  const { t } = useApp();
  const list = options && options.length > 0 ? options : [""];

  const updateOption = (index: number, val: string) => {
    const next = [...list];
    next[index] = val;
    onChange(next);
  };

  const addOption = () => {
    onChange([...list, ""]);
  };

  const removeOption = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [""]);
  };

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-border bg-surface-muted/40 p-2.5">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{t("settings.fieldOptions")}</span>
      </div>

      <div className="space-y-2">
        {list.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
              className="h-8 text-xs flex-1"
            />
            {index === list.length - 1 ? (
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={addOption}
                className="h-8 px-2.5 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("common.add")}
              </Button>
            ) : null}
            {list.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0"
                title={t("common.remove")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
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