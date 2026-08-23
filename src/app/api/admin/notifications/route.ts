import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const guard = await requireAdmin("audit:read");
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count(),
  ]);

  return NextResponse.json({
    notifications,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}
