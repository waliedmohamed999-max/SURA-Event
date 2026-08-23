import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin("reports:read");
  if ("response" in guard) return guard.response;

  const [totalShops, shopsByStatus, applicationsByStatus, categories, applications, rentals, rentedShops] =
    await Promise.all([
      prisma.shop.count(),
      prisma.shop.groupBy({ by: ["status"], _count: true }),
      prisma.application.groupBy({ by: ["status"], _count: true }),
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.application.findMany({ select: { status: true, brandCategory: true, shop: { select: { category: { select: { key: true, nameEn: true } } } } } }),
      prisma.rental.findMany({
        include: { shop: { select: { shopNumber: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.shop.findMany({ where: { status: "rented" }, select: { rentalPrice: true } }),
    ]);

  const shopCount = (status: string) => shopsByStatus.find((s) => s.status === status)?._count ?? 0;
  const available = shopCount("available");
  const rented = shopCount("rented");
  const reserved = shopCount("reserved");
  const occupancyRate = totalShops > 0 ? Math.round(((rented + reserved) / totalShops) * 100) : 0;

  const applicationsByCategory = new Map<string, number>();
  for (const a of applications) {
    const key = a.shop.category.nameEn;
    applicationsByCategory.set(key, (applicationsByCategory.get(key) ?? 0) + 1);
  }

  const revenueKnown = rentedShops.filter((s) => s.rentalPrice !== null);
  const totalRevenue = revenueKnown.reduce((sum, s) => sum + (s.rentalPrice ?? 0), 0);

  return NextResponse.json({
    occupancy: { rate: occupancyRate, totalShops, available, rented, reserved },
    applicationsByStatus: applicationsByStatus.map((a) => ({ status: a.status, count: a._count })),
    applicationsByCategory: Array.from(applicationsByCategory.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    categories: categories.map((c) => ({ key: c.key, nameEn: c.nameEn, nameAr: c.nameAr, colorHex: c.colorHex })),
    revenue: {
      total: totalRevenue,
      shopsWithPricing: revenueKnown.length,
      shopsRentedTotal: rentedShops.length,
      note:
        rentedShops.length > revenueKnown.length
          ? `${rentedShops.length - revenueKnown.length} rented shop(s) have no rental price configured and are excluded from this total.`
          : null,
    },
    rentalHistory: rentals.map((r) => ({
      id: r.id,
      shopNumber: r.shop.shopNumber,
      tenantName: r.tenantName,
      companyName: r.companyName,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    })),
  });
}
