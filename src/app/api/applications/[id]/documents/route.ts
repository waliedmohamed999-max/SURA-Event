import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@/generated/prisma/enums";
import { FileValidationError, saveApplicationFile, validateUploadedFile } from "@/lib/storage";

const DOCUMENT_TYPES = new Set<DocumentType>([
  "commercial_registration",
  "brand_profile",
  "product_catalog",
  "identity_document",
  "tax_certificate",
  "other",
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  const typeRaw = formData.get("type");
  const type: DocumentType =
    typeof typeRaw === "string" && DOCUMENT_TYPES.has(typeRaw as DocumentType)
      ? (typeRaw as DocumentType)
      : "other";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    validateUploadedFile(file);
  } catch (err) {
    if (err instanceof FileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const saved = await saveApplicationFile(application.id, file);

  const document = await prisma.document.create({
    data: {
      applicationId: application.id,
      type,
      storageKey: saved.storageKey,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
    },
  });

  return NextResponse.json(
    { document: { id: document.id, type: document.type, fileName: document.fileName } },
    { status: 201 }
  );
}
