import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Private file storage adapter. Files live outside `public/` so nothing is
 * served statically — the only way to read one back is the authenticated
 * admin download route (Phase 2). Swap the implementation for an S3 client
 * later; callers only depend on this module's exported functions, not on
 * the filesystem.
 */

// STORAGE_ROOT_DIR lets deployments point uploads at a persistent volume
// (e.g. a Render Disk mounted at /var/data) — without it, uploaded files
// live on the container's ephemeral filesystem and are lost on every
// redeploy/restart. Defaults to a local folder for dev.
const STORAGE_ROOT = process.env.STORAGE_ROOT_DIR
  ? path.resolve(process.env.STORAGE_ROOT_DIR)
  : path.join(process.cwd(), "storage", "uploads");

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class FileValidationError extends Error {}

export function validateUploadedFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new FileValidationError(
      `File type "${file.type || "unknown"}" is not allowed. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX.`
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError("File exceeds the 10MB size limit.");
  }
  if (file.size === 0) {
    throw new FileValidationError("File is empty.");
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

/** Saves a validated file under storage/uploads/<applicationId>/ and returns its relative storage key. */
export async function saveApplicationFile(applicationId: string, file: File): Promise<{
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}> {
  const dir = path.join(STORAGE_ROOT, applicationId);
  await mkdir(dir, { recursive: true });

  const safeName = sanitizeFileName(file.name || "upload");
  const storageKey = path.posix.join(applicationId, `${randomUUID()}-${safeName}`);
  const fullPath = path.join(STORAGE_ROOT, storageKey);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    storageKey,
    fileName: file.name || safeName,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export function resolveStoragePath(storageKey: string): string {
  const normalized = path.normalize(storageKey);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid storage key");
  }
  return path.join(STORAGE_ROOT, normalized);
}
