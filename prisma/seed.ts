import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CATEGORIES,
  STATUS_CONFIG,
  SHOPS,
  buildPavilionGeometry,
} from "../src/lib/pavilion-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding categories...");
  const categoryByKey = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { key: c.key },
      update: {
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        icon: c.icon,
        colorHex: c.colorHex,
        displayOrder: c.displayOrder,
      },
      create: {
        key: c.key,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        icon: c.icon,
        colorHex: c.colorHex,
        displayOrder: c.displayOrder,
      },
    });
    categoryByKey.set(c.key, row.id);
  }

  console.log("Seeding status config...");
  for (const s of STATUS_CONFIG) {
    await prisma.statusConfig.upsert({
      where: { key: s.key },
      update: { labelEn: s.labelEn, labelAr: s.labelAr, colorHex: s.colorHex, order: s.order },
      create: { key: s.key, labelEn: s.labelEn, labelAr: s.labelAr, colorHex: s.colorHex, order: s.order },
    });
  }

  console.log("Seeding shops + geometry...");
  const { shops: geometry } = buildPavilionGeometry();
  const geometryByNumber = new Map(geometry.map((g) => [g.shopNumber, g]));

  const shopIdByNumber = new Map<string, string>();
  for (const s of SHOPS) {
    const categoryId = categoryByKey.get(s.categoryKey);
    if (!categoryId) throw new Error(`Unknown category ${s.categoryKey}`);

    const shop = await prisma.shop.upsert({
      where: { shopNumber: s.shopNumber },
      update: {
        categoryId,
        area: s.area,
        location: s.location,
      },
      create: {
        shopNumber: s.shopNumber,
        categoryId,
        area: s.area,
        location: s.location,
        status: "available",
      },
    });
    shopIdByNumber.set(s.shopNumber, shop.id);

    const geo = geometryByNumber.get(s.shopNumber);
    if (!geo) throw new Error(`No geometry for shop ${s.shopNumber}`);
    const polygonPoints = geo.polygonPoints as unknown as Prisma.InputJsonValue;
    const centerPoint = geo.centerPoint as unknown as Prisma.InputJsonValue;
    const labelPosition = geo.labelPosition as unknown as Prisma.InputJsonValue;
    await prisma.shopGeometry.upsert({
      where: { shopId: shop.id },
      update: {
        polygonPoints,
        centerPoint,
        labelPosition,
        rotation: geo.rotation,
      },
      create: {
        shopId: shop.id,
        polygonPoints,
        centerPoint,
        labelPosition,
        rotation: geo.rotation,
      },
    });
  }

  // --- DEV-ONLY DEMO DATA -----------------------------------------------
  // The shops/categories/areas above are real, extracted from the source PDF.
  // Everything below (applicants, applications, statuses) is fabricated
  // purely so the UI has something to show for pending/reserved/rented
  // states. Clearly not real tenant data. Safe to skip in production seeding.
  const demoAlreadySeeded = await prisma.application.findUnique({
    where: { applicationNumber: "TA-2026-00001" },
  });

  if (process.env.SEED_DEMO_DATA !== "false" && !demoAlreadySeeded) {
    console.log("Seeding DEMO applications (dev only)...");

    const demoApplicant = await prisma.applicant.create({
      data: {
        fullName: "Demo Applicant — Fatima Al-Sayed",
        companyName: "Demo Co. — Sayed Fragrances",
        email: "demo.applicant@example.com",
        mobile: "+973 3000 0000",
        country: "Bahrain",
        city: "Manama",
      },
    });

    const pendingShopId = shopIdByNumber.get("05")!;
    await prisma.shop.update({ where: { id: pendingShopId }, data: { status: "application_pending" } });
    await prisma.application.create({
      data: {
        applicationNumber: "TA-2026-00001",
        applicantId: demoApplicant.id,
        shopId: pendingShopId,
        businessActivity: "Retail of perfumes and fragrances (demo)",
        brandCategory: "Perfumes",
        yearsInBusiness: 5,
        preferredRentalPeriod: "12 months",
        staffCount: 2,
        agreedToTerms: true,
        status: "under_review",
      },
    });

    const rentedShopId = shopIdByNumber.get("18")!;
    await prisma.shop.update({ where: { id: rentedShopId }, data: { status: "rented" } });
    const rentedApp = await prisma.application.create({
      data: {
        applicationNumber: "TA-2026-00002",
        applicantId: demoApplicant.id,
        shopId: rentedShopId,
        businessActivity: "Nuts and dried fruit retail (demo)",
        brandCategory: "Food Products & Nuts",
        yearsInBusiness: 8,
        preferredRentalPeriod: "24 months",
        staffCount: 3,
        agreedToTerms: true,
        status: "rented",
      },
    });
    await prisma.rental.create({
      data: {
        shopId: rentedShopId,
        applicationId: rentedApp.id,
        tenantName: demoApplicant.fullName,
        companyName: demoApplicant.companyName,
        startDate: new Date("2026-01-01"),
        status: "active",
      },
    });

    const reservedShopId = shopIdByNumber.get("27")!;
    await prisma.shop.update({ where: { id: reservedShopId }, data: { status: "reserved" } });
    await prisma.application.create({
      data: {
        applicationNumber: "TA-2026-00003",
        applicantId: demoApplicant.id,
        shopId: reservedShopId,
        businessActivity: "Gift and accessory retail (demo)",
        brandCategory: "Accessories & Gifts",
        yearsInBusiness: 2,
        preferredRentalPeriod: "12 months",
        staffCount: 1,
        agreedToTerms: true,
        status: "approved",
      },
    });
  }

  const existingSuperAdmin = await prisma.adminUser.findFirst({ where: { role: "super_admin" } });
  if (!existingSuperAdmin) {
    const email = process.env.SEED_ADMIN_EMAIL ?? "admin@asiaroad-gvd.local";
    const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({
      data: { name: "Super Admin", email, passwordHash, role: "super_admin" },
    });
    console.log("\nDefault Super Admin created — save these credentials, they will not be shown again:");
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}\n`);
  } else {
    console.log("Super Admin already exists, skipping.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
