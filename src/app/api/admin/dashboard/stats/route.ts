import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin("dashboard:read");
  if ("response" in guard) return guard.response;

  const [shopsByStatus, applicationsByStatus, applicationsByCategory, totalShops, statusConfig, categories] =
    await Promise.all([
      prisma.shop.groupBy({ by: ["status"], _count: true }),
      prisma.application.groupBy({ by: ["status"], _count: true }),
      prisma.application.groupBy({ by: ["brandCategory"], _count: true }),
      prisma.shop.count(),
      prisma.statusConfig.findMany({ orderBy: { order: "asc" } }),
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
    ]);

  const shopStatusCounts = Object.fromEntries(shopsByStatus.map((s) => [s.status, s._count]));
  const applicationStatusCounts = Object.fromEntries(applicationsByStatus.map((a) => [a.status, a._count]));

  // Occupancy by category: how many shops of each category are rented/reserved vs available.
  const shopsByCategoryAndStatus = await prisma.shop.findMany({
    select: { status: true, category: { select: { key: true, nameEn: true, nameAr: true, colorHex: true } } },
  });
  const occupancyByCategory = categories.map((c) => {
    const shops = shopsByCategoryAndStatus.filter((s) => s.category.key === c.key);
    const occupied = shops.filter((s) => s.status === "rented" || s.status === "reserved").length;
    return {
      key: c.key,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      colorHex: c.colorHex,
      total: shops.length,
      occupied,
    };
  });

  return NextResponse.json({
    totalShops,
    shopStatusCounts,
    applicationStatusCounts,
    applicationsByCategory: applicationsByCategory.map((a) => ({
      category: a.brandCategory ?? "Unspecified",
      count: a._count,
    })),
    occupancyByCategory,
    statusConfig,
  });
}
