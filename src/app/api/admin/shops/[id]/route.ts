import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { updateShopSchema } from "@/lib/admin-validation";
import { atomicShopStatusUpdate } from "@/lib/shop-status";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("shops:read");
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      category: true,
      geometry: true,
      applications: { orderBy: { submittedAt: "desc" }, include: { applicant: true } },
      rentals: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  return NextResponse.json({ shop });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("shops:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { geometry, status, ...fields } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.shop.findUnique({ where: { id } });
    if (!existing) return { kind: "not_found" as const };

    if (Object.keys(fields).length > 0) {
      // fields may include categoryId which is a relation scalar — Prisma
      // accepts it directly on ShopUpdateInput as a foreign key write.
      await tx.shop.update({ where: { id }, data: fields as Prisma.ShopUpdateInput });
    }

    if (status && status !== existing.status) {
      const moved = await atomicShopStatusUpdate(tx, { shopId: id, fromStatus: existing.status, toStatus: status });
      if (moved) {
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "admin.shop.status_changed",
            entityType: "Shop",
            entityId: id,
            shopId: id,
            previousValue: existing.status,
            newValue: status,
          },
        });
      } else {
        return { kind: "conflict" as const };
      }
    }

    if (geometry) {
      await tx.shopGeometry.upsert({
        where: { shopId: id },
        update: {
          polygonPoints: geometry.polygonPoints,
          centerPoint: geometry.centerPoint,
          labelPosition: geometry.labelPosition,
          rotation: geometry.rotation,
        },
        create: {
          shopId: id,
          polygonPoints: geometry.polygonPoints,
          centerPoint: geometry.centerPoint,
          labelPosition: geometry.labelPosition,
          rotation: geometry.rotation,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "admin.shop.geometry_edited",
          entityType: "Shop",
          entityId: id,
          shopId: id,
        },
      });
    }

    const updated = await tx.shop.findUnique({ where: { id }, include: { category: true, geometry: true } });
    return { kind: "ok" as const, shop: updated };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
  if (result.kind === "conflict") {
    return NextResponse.json({ error: "Shop status changed concurrently, please refresh." }, { status: 409 });
  }
  return NextResponse.json({ shop: result.shop });
}
