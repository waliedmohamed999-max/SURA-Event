import type { ShopStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * The atomic double-booking guard: a conditional `updateMany`
 * (`WHERE id = ? AND status = ?`) so the check-then-set is a single SQL
 * statement, not an app-level read-then-write. Returns false (and changes
 * nothing) if the shop was no longer in the expected status — e.g. someone
 * else already applied for it a moment earlier.
 */
export async function atomicShopStatusUpdate(
  tx: Tx,
  params: { shopId: string; fromStatus: ShopStatus | ShopStatus[]; toStatus: ShopStatus }
): Promise<boolean> {
  const fromList = Array.isArray(params.fromStatus) ? params.fromStatus : [params.fromStatus];
  const result = await tx.shop.updateMany({
    where: { id: params.shopId, status: { in: fromList } },
    data: { status: params.toStatus },
  });
  return result.count > 0;
}

/**
 * Combines the atomic guard above with an audit log entry. Use this when
 * `applicationId` (if any) already refers to a row that exists in this
 * transaction — otherwise the audit log's foreign key will fail. For the
 * "create application" flow, where the application doesn't exist yet at the
 * moment the guard must run, call `atomicShopStatusUpdate` directly and log
 * separately once the application row is created.
 */
export async function transitionShopStatus(
  tx: Tx,
  params: {
    shopId: string;
    fromStatus: ShopStatus | ShopStatus[];
    toStatus: ShopStatus;
    actorId?: string | null;
    action: string;
    applicationId?: string;
    notes?: string;
  }
): Promise<boolean> {
  const fromList = Array.isArray(params.fromStatus) ? params.fromStatus : [params.fromStatus];
  const moved = await atomicShopStatusUpdate(tx, {
    shopId: params.shopId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
  });

  if (!moved) {
    return false;
  }

  await tx.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: "Shop",
      entityId: params.shopId,
      shopId: params.shopId,
      applicationId: params.applicationId,
      previousValue: fromList.join(","),
      newValue: params.toStatus,
      notes: params.notes,
    },
  });

  return true;
}
