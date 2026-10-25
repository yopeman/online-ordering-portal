import "server-only";
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from "cloudinary";

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

function getCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
  }
  return cloudinary;
}

/**
 * Persists an uploaded file. When CLOUDINARY_URL is available, it streams the
 * file directly to Cloudinary and returns its secure URL. Otherwise, it falls back
 * to a Base64 data URL.
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
  const isImg = isImage(file.type);

  if (process.env.CLOUDINARY_URL) {
    const cld = getCloudinary();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cld.uploader.upload_stream(
        {
          folder: "yope-order",
          resource_type: "auto",
        },
        (error: UploadApiErrorResponse | undefined, res: UploadApiResponse | undefined) => {
          if (error || !res) {
            reject(error || new Error("Cloudinary upload failed."));
          } else {
            resolve(res);
          }
        },
      );
      uploadStream.end(buffer);
    });

    return {
      url: result.secure_url,
      name: file.name,
      size: file.size,
      type: isImg ? "image" : "file",
    };
  }

  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  return {
    url: dataUrl,
    name: file.name,
    size: file.size,
    type: isImg ? "image" : "file",
  };
}