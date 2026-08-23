import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const guard = await requireAdmin("reports:read");
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "applications";

  let csv: string;
  let filename: string;

  if (type === "shops") {
    const shops = await prisma.shop.findMany({
      include: { category: true },
      orderBy: { shopNumber: "asc" },
    });
    csv = toCsv(
      shops.map((s) => ({
        shopNumber: s.shopNumber,
        category: s.category.nameEn,
        area: s.area,
        status: s.status,
        rentalPrice: s.rentalPrice,
        rentalPeriod: s.rentalPeriod,
      })),
      [
        { key: "shopNumber", header: "Shop Number" },
        { key: "category", header: "Category" },
        { key: "area", header: "Area (sqm)" },
        { key: "status", header: "Status" },
        { key: "rentalPrice", header: "Rental Price" },
        { key: "rentalPeriod", header: "Rental Period" },
      ]
    );
    filename = "shops.csv";
  } else if (type === "rentals") {
    const rentals = await prisma.rental.findMany({
      include: { shop: { select: { shopNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv(
      rentals.map((r) => ({
        shopNumber: r.shop.shopNumber,
        tenantName: r.tenantName,
        companyName: r.companyName,
        startDate: r.startDate?.toISOString().slice(0, 10),
        endDate: r.endDate?.toISOString().slice(0, 10),
        status: r.status,
      })),
      [
        { key: "shopNumber", header: "Shop Number" },
        { key: "tenantName", header: "Tenant" },
        { key: "companyName", header: "Company" },
        { key: "startDate", header: "Start Date" },
        { key: "endDate", header: "End Date" },
        { key: "status", header: "Status" },
      ]
    );
    filename = "rental-history.csv";
  } else {
    const applications = await prisma.application.findMany({
      include: { applicant: true, shop: { include: { category: true } } },
      orderBy: { submittedAt: "desc" },
    });
    csv = toCsv(
      applications.map((a) => ({
        applicationNumber: a.applicationNumber,
        applicant: a.applicant.fullName,
        company: a.applicant.companyName,
        shopNumber: a.shop.shopNumber,
        category: a.shop.category.nameEn,
        status: a.status,
        submittedAt: a.submittedAt.toISOString().slice(0, 10),
      })),
      [
        { key: "applicationNumber", header: "Application #" },
        { key: "applicant", header: "Applicant" },
        { key: "company", header: "Company" },
        { key: "shopNumber", header: "Shop" },
        { key: "category", header: "Category" },
        { key: "status", header: "Status" },
        { key: "submittedAt", header: "Submitted" },
      ]
    );
    filename = "applications.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
