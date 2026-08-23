import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { buildPavilionGeometry } from "@/lib/pavilion-data";
import { toShopDTO } from "@/lib/shop-dto";
import { AdminMapEditor } from "@/components/admin/AdminMapEditor";

export const revalidate = 0;

export default async function AdminMapEditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.mapEditor");

  const [shops, categories, statuses] = await Promise.all([
    prisma.shop.findMany({ include: { category: true, geometry: true }, orderBy: { shopNumber: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
    prisma.statusConfig.findMany({ orderBy: { order: "asc" } }),
  ]);
  const { decorativeZones, buildingOutline } = buildPavilionGeometry();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <AdminMapEditor
        shops={shops.map(toShopDTO)}
        categories={categories}
        statuses={statuses}
        decorativeZones={decorativeZones}
        buildingOutline={buildingOutline}
      />
    </div>
  );
}
