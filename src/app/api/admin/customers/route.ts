import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

/**
 * "Customers" is a customer-centric view over the same Application data
 * (each application currently creates its own Applicant record — there is
 * no cross-application customer profile to merge yet), surfaced with the
 * fields the leasing team actually needs at a glance: contact info, CR
 * number, national address, and whether all required documents are in.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("applications:read");
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const where: Prisma.ApplicationWhereInput = search
    ? {
        OR: [
          { applicant: { fullName: { contains: search, mode: "insensitive" } } },
          { applicant: { companyName: { contains: search, mode: "insensitive" } } },
          { applicant: { email: { contains: search, mode: "insensitive" } } },
          { crNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { applicant: true, shop: { select: { shopNumber: true } }, documents: { select: { type: true } } },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.application.count({ where }),
  ]);

  const customers = applications.map((a) => {
    const presentTypes = new Set(a.documents.map((d) => d.type));
    const missingTypes = REQUIRED_DOCUMENT_TYPES.filter((t) => !presentTypes.has(t));
    return {
      applicationId: a.id,
      applicationNumber: a.applicationNumber,
      fullName: a.applicant.fullName,
      companyName: a.applicant.companyName,
      email: a.applicant.email,
      mobile: a.applicant.mobile,
      crNumber: a.crNumber,
      nationalAddress: a.nationalAddress,
      shopNumber: a.shop.shopNumber,
      submittedAt: a.submittedAt,
      missingDocumentCount: missingTypes.length,
    };
  });

  return NextResponse.json({
    customers,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
