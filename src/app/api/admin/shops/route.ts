import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { createShopSchema } from "@/lib/admin-validation";

export async function POST(request: Request) {
  const guard = await requireAdmin("shops:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const body = await request.json().catch(() => null);
  const parsed = createShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { geometry, ...fields } = parsed.data;

  const existing = await prisma.shop.findUnique({ where: { shopNumber: fields.shopNumber } });
  if (existing) {
    return NextResponse.json({ error: "A shop with this number already exists." }, { status: 409 });
  }

  const shop = await prisma.shop.create({
    data: {
      ...fields,
      status: "available",
      geometry: {
        create: {
          polygonPoints: geometry.polygonPoints,
          centerPoint: geometry.centerPoint,
          labelPosition: geometry.labelPosition,
          rotation: geometry.rotation,
        },
      },
    },
    include: { category: true, geometry: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.shop.created",
      entityType: "Shop",
      entityId: shop.id,
      shopId: shop.id,
    },
  });

  return NextResponse.json({ shop }, { status: 201 });
}
