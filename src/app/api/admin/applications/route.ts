import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import type { Prisma } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const guard = await requireAdmin("applications:read");
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const shopNumber = searchParams.get("shopNumber");
  const search = searchParams.get("search");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const where: Prisma.ApplicationWhereInput = {};
  if (status) where.status = status as ApplicationStatus;
  if (category || shopNumber) {
    where.shop = {
      ...(category ? { category: { key: category } } : {}),
      ...(shopNumber ? { shopNumber } : {}),
    };
  }
  if (search) {
    where.OR = [
      { applicationNumber: { contains: search, mode: "insensitive" } },
      { applicant: { fullName: { contains: search, mode: "insensitive" } } },
      { applicant: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        applicant: true,
        shop: { include: { category: true } },
        assignedEmployee: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.application.count({ where }),
  ]);

  return NextResponse.json({
    applications,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
