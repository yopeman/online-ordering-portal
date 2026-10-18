import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per file

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

/** Public URL prefix the stored files are served from. */
export const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Resolves the directory uploads are written to. Defaults to `public/uploads`
 * which works for `next dev` and self hosted `next start` deployments; point
 * `UPLOAD_DIR` somewhere else (e.g. a mounted volume) when running on a
 * platform with a read-only filesystem.
 */
export function uploadDir(): string {
  const configured = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

/**
 * Persists an uploaded file and returns its public URL. Files are renamed to a
 * random name so user input never reaches the filesystem path.
 */
export async function saveUpload(file: File): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Files must be smaller than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only images and PDF files are supported.");
  }

  const extension = EXTENSION_BY_MIME[file.type] ?? "";
  const name = `${randomUUID()}${extension}`;
  const directory = uploadDir();

  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(/*turbopackIgnore: true*/ directory, name),
    Buffer.from(await file.arrayBuffer()),
  );

  return {
    url: `${UPLOAD_URL_PREFIX}/${name}`,
    name: file.name,
    size: file.size,
    type: isImage(file.type) ? "image" : "file",
  };
}