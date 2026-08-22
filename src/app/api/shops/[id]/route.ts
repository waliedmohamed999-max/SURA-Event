import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toShopDTO } from "@/lib/shop-dto";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: { category: true, geometry: true },
  });

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  return NextResponse.json({ shop: toShopDTO(shop) });
}
