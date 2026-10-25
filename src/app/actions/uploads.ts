"use server";

import { saveUpload } from "@/lib/uploads";
import { getCurrentUser } from "@/lib/auth/session";

export interface UploadResult {
  ok: boolean;
  error?: string;
  files: { url: string; name: string; size: number; type: string }[];
}

/**
 * Stores files uploaded through the business / product forms. Requires a
 * signed in account; the parent entity is attached when the form is saved.
 */
export async function uploadFilesAction(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please sign in to upload files.", files: [] };
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) return { ok: true, files: [] };

  const saved = [];
  for (const file of files.slice(0, 10)) {
    try {
      saved.push(await saveUpload(file));
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Upload failed.",
        files: saved,
      };
    }
  }

  return { ok: true, files: saved };
}
