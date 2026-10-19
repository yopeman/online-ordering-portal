import "server-only";

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

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

/**
 * Persists an uploaded file as a Base64 data URL.
 * Does not require writing to the local filesystem.
 */
export async function saveUpload(file: File): Promise<UploadedFile> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Files must be smaller than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only images and PDF files are supported.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  return {
    url: dataUrl,
    name: file.name,
    size: file.size,
    type: isImage(file.type) ? "image" : "file",
  };
}