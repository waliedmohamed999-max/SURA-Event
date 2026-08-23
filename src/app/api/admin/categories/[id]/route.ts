import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const updateCategorySchema = z.object({
  nameEn: z.string().trim().min(1).optional(),
  nameAr: z.string().trim().min(1).optional(),
  descriptionEn: z.string().trim().nullable().optional(),
  descriptionAr: z.string().trim().nullable().optional(),
  icon: z.string().trim().nullable().optional(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("categories:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const category = await prisma.category.update({ where: { id }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.category.updated",
      entityType: "Category",
      entityId: id,
    },
  });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("categories:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const { id } = await params;
  const shopCount = await prisma.shop.count({ where: { categoryId: id } });
  if (shopCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${shopCount} shop(s) still use this category. Deactivate it instead.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "admin.category.deleted", entityType: "Category", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
