import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema } from "@/lib/validation";
import { atomicShopStatusUpdate } from "@/lib/shop-status";
import { generateApplicationNumber, APPLICATION_NUMBER_MAX_RETRIES } from "@/lib/application-number";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const data = parsed.data;

  let lastError: unknown;
  for (let attempt = 0; attempt < APPLICATION_NUMBER_MAX_RETRIES; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({ where: { id: data.shopId } });
        if (!shop) {
          return { kind: "not_found" as const };
        }

        const applicationId = randomUUID();

        // The one line of code that actually prevents double-booking: an
        // atomic conditional UPDATE, not a read-then-write check. The audit
        // log entry is written further down, once the application row this
        // transition relates to actually exists (its FK requires that).
        const moved = await atomicShopStatusUpdate(tx, {
          shopId: shop.id,
          fromStatus: "available",
          toStatus: "application_pending",
        });
        if (!moved) {
          return { kind: "unavailable" as const };
        }

        const applicant = await tx.applicant.create({
          data: {
            fullName: data.fullName,
            companyName: data.companyName || null,
            email: data.email,
            mobile: data.mobile,
            country: data.country,
            city: data.city,
          },
        });

        const applicationNumber = await generateApplicationNumber(tx);

        const application = await tx.application.create({
          data: {
            id: applicationId,
            applicationNumber,
            applicantId: applicant.id,
            shopId: shop.id,
            businessActivity: data.businessActivity,
            brandCategory: data.brandCategory || null,
            yearsInBusiness: data.yearsInBusiness ?? null,
            website: data.website || null,
            instagram: data.instagram || null,
            crNumber: data.crNumber || null,
            preferredRentalPeriod: data.preferredRentalPeriod || null,
            staffCount: data.staffCount ?? null,
            additionalRequirements: data.additionalRequirements || null,
            agreedToTerms: data.agreedToTerms,
            status: "new",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "application.submitted",
            entityType: "Shop",
            entityId: shop.id,
            shopId: shop.id,
            applicationId: application.id,
            previousValue: "available",
            newValue: "application_pending",
          },
        });

        return { kind: "ok" as const, application };
      });

      if (result.kind === "not_found") {
        return NextResponse.json({ error: "Shop not found", code: "SHOP_NOT_FOUND" }, { status: 404 });
      }
      if (result.kind === "unavailable") {
        return NextResponse.json(
          { error: "This shop is no longer available.", code: "SHOP_UNAVAILABLE" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          application: {
            id: result.application.id,
            applicationNumber: result.application.applicationNumber,
            status: result.application.status,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      // Unique constraint on applicationNumber: another request landed on the
      // same sequence number in the same instant. Retry with a fresh count.
      lastError = err;
      if (isUniqueConstraintError(err)) {
        continue;
      }
      console.error("Failed to create application", err);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }
  }

  console.error("Exhausted retries generating application number", lastError);
  return NextResponse.json({ error: "Failed to submit application, please try again" }, { status: 500 });
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
