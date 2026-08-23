import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { atomicShopStatusUpdate } from "@/lib/shop-status";
import type { ShopStatus } from "@/generated/prisma/enums";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("applications:read");
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      applicant: true,
      shop: { include: { category: true } },
      documents: true,
      assignedEmployee: { select: { id: true, name: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ application });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start_review") }),
  z.object({ action: z.literal("request_documents"), notes: z.string().optional() }),
  z.object({ action: z.literal("approve"), notes: z.string().optional() }),
  z.object({ action: z.literal("reject"), notes: z.string().optional() }),
  z.object({ action: z.literal("cancel"), notes: z.string().optional() }),
  z.object({ action: z.literal("mark_rented"), startDate: z.string().optional() }),
  z.object({ action: z.literal("release") }),
  z.object({ action: z.literal("assign"), assignedEmployeeId: z.string().nullable() }),
  z.object({ action: z.literal("note"), notes: z.string() }),
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("applications:write");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({ where: { id }, include: { shop: true } });
    if (!application) return { kind: "not_found" as const };

    const logShopChange = async (
      shopId: string,
      from: ShopStatus | ShopStatus[],
      to: ShopStatus,
      action: string
    ) => {
      const moved = await atomicShopStatusUpdate(tx, { shopId, fromStatus: from, toStatus: to });
      if (moved) {
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action,
            entityType: "Shop",
            entityId: shopId,
            shopId,
            applicationId: application.id,
            previousValue: Array.isArray(from) ? from.join(",") : from,
            newValue: to,
          },
        });
      }
      return moved;
    };

    switch (input.action) {
      case "start_review": {
        await tx.application.update({ where: { id }, data: { status: "under_review" } });
        break;
      }
      case "request_documents": {
        await tx.application.update({
          where: { id },
          data: { status: "documents_required", internalNotes: input.notes ?? application.internalNotes },
        });
        break;
      }
      case "approve": {
        await tx.application.update({
          where: { id },
          data: { status: "approved", internalNotes: input.notes ?? application.internalNotes },
        });
        await logShopChange(
          application.shopId,
          ["application_pending", "under_review"],
          "reserved",
          "application.approved"
        );
        break;
      }
      case "reject": {
        await tx.application.update({
          where: { id },
          data: { status: "rejected", internalNotes: input.notes ?? application.internalNotes },
        });
        await logShopChange(
          application.shopId,
          ["application_pending", "under_review"],
          "available",
          "application.rejected"
        );
        break;
      }
      case "cancel": {
        await tx.application.update({
          where: { id },
          data: { status: "cancelled", internalNotes: input.notes ?? application.internalNotes },
        });
        await logShopChange(
          application.shopId,
          ["application_pending", "under_review"],
          "available",
          "application.cancelled"
        );
        break;
      }
      case "mark_rented": {
        await tx.application.update({ where: { id }, data: { status: "rented" } });
        const moved = await logShopChange(application.shopId, ["reserved", "approved"], "rented", "application.rented");
        if (moved) {
          const applicant = await tx.applicant.findUnique({ where: { id: application.applicantId } });
          await tx.rental.create({
            data: {
              shopId: application.shopId,
              applicationId: application.id,
              tenantName: applicant?.fullName ?? "Unknown",
              companyName: applicant?.companyName,
              startDate: input.startDate ? new Date(input.startDate) : new Date(),
              status: "active",
            },
          });
        }
        break;
      }
      case "release": {
        await logShopChange(
          application.shopId,
          ["rented", "reserved", "approved", "application_pending", "under_review"],
          "available",
          "shop.released"
        );
        await tx.rental.updateMany({
          where: { shopId: application.shopId, status: "active" },
          data: { status: "terminated", endDate: new Date() },
        });
        break;
      }
      case "assign": {
        await tx.application.update({ where: { id }, data: { assignedEmployeeId: input.assignedEmployeeId } });
        break;
      }
      case "note": {
        await tx.application.update({ where: { id }, data: { internalNotes: input.notes } });
        break;
      }
    }

    const updated = await tx.application.findUnique({
      where: { id },
      include: { applicant: true, shop: { include: { category: true } } },
    });
    return { kind: "ok" as const, application: updated };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ application: result.application });
}
