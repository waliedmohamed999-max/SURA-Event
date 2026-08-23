import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin("categories:read");
  if ("response" in guard) return guard.response;

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { shops: true } } },
  });
  return NextResponse.json({ categories });
}

const createCategorySchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores only"),
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #16A34A"),
  displayOrder: z.number().int().default(0),
});

export async function POST(request: Request) {
  const guard = await requireAdmin("categories:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const body = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    return NextResponse.json({ error: "A category with this key already exists." }, { status: 409 });
  }

  const category = await prisma.category.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.category.created",
      entityType: "Category",
      entityId: category.id,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
