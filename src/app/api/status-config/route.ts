import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const statuses = await prisma.statusConfig.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ statuses });
}
