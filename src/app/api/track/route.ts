import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackApplicationSchema } from "@/lib/validation";

/**
 * Public application lookup. Requires the application number PLUS the
 * applicant's own email or mobile — never look up by internal database id,
 * so a customer can't enumerate other people's applications.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = trackApplicationSchema.safeParse({
    applicationNumber: searchParams.get("applicationNumber") ?? "",
    contact: searchParams.get("contact") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Application number and contact are required" }, { status: 400 });
  }

  const { applicationNumber, contact } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { applicationNumber },
    include: { applicant: true, shop: { include: { category: true } } },
  });

  const contactLower = contact.trim().toLowerCase();
  const matches =
    application &&
    (application.applicant.email.toLowerCase() === contactLower ||
      application.applicant.mobile.replace(/\s+/g, "") === contact.replace(/\s+/g, ""));

  if (!application || !matches) {
    return NextResponse.json(
      { error: "No application found for that number and contact." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    application: {
      applicationNumber: application.applicationNumber,
      status: application.status,
      submittedAt: application.submittedAt,
      shop: {
        shopNumber: application.shop.shopNumber,
        categoryEn: application.shop.category.nameEn,
        categoryAr: application.shop.category.nameAr,
      },
    },
  });
}
