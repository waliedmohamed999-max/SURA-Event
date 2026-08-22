import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ShopStatus } from "@/generated/prisma/enums";
import { toShopDTO } from "@/lib/shop-dto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.ShopWhereInput = {};
  if (category) where.category = { key: category };
  if (status) where.status = status as ShopStatus;
  if (search) where.shopNumber = { contains: search, mode: "insensitive" };

  const shops = await prisma.shop.findMany({
    where,
    include: { category: true, geometry: true },
    orderBy: { shopNumber: "asc" },
  });

  // Never leak tenant/applicant details on the public list endpoint.
  const publicShops = shops.map(toShopDTO);

  return NextResponse.json({ shops: publicShops });
}
