import type { Prisma } from "@/generated/prisma/client";

/**
 * Generates the next `GVB-<year>-<00001>` application number.
 * Must be called from inside the same transaction that creates the
 * Application row so the count used to derive the sequence is consistent;
 * the caller should retry on a unique-constraint error (P2002) since this
 * is a best-effort sequence, not a DB-level counter.
 */
export async function generateApplicationNumber(
  tx: Prisma.TransactionClient,
  year = new Date().getFullYear()
): Promise<string> {
  const prefix = `GVB-${year}-`;
  const count = await tx.application.count({
    where: { applicationNumber: { startsWith: prefix } },
  });
  const sequence = String(count + 1).padStart(5, "0");
  return `${prefix}${sequence}`;
}

export const APPLICATION_NUMBER_MAX_RETRIES = 5;
