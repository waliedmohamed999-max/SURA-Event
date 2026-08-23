import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BarChart, DonutChart } from "@/components/admin/Charts";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.dashboard");

  const [totalShops, shopsByStatus, applicationsByStatus, statusConfig, categories, shops] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.groupBy({ by: ["status"], _count: true }),
    prisma.application.groupBy({ by: ["status"], _count: true }),
    prisma.statusConfig.findMany({ orderBy: { order: "asc" } }),
    prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.shop.findMany({ select: { status: true, category: { select: { key: true, nameEn: true, nameAr: true, colorHex: true } } } }),
  ]);

  const shopCount = (status: string) => shopsByStatus.find((s) => s.status === status)?._count ?? 0;
  const appCount = (status: string) => applicationsByStatus.find((a) => a.status === status)?._count ?? 0;

  const cards = [
    { label: t("totalShops"), value: totalShops },
    { label: t("availableShops"), value: shopCount("available") },
    { label: t("pendingApplications"), value: appCount("new") },
    { label: t("underReview"), value: appCount("under_review") },
    { label: t("approved"), value: appCount("approved") },
    { label: t("rented"), value: shopCount("rented") },
    { label: t("reserved"), value: shopCount("reserved") },
  ];

  const statusChartData = statusConfig.map((s) => ({
    label: locale === "ar" ? s.labelAr : s.labelEn,
    value: shopCount(s.key),
    color: s.colorHex,
  }));

  const occupancyData = categories.map((c) => {
    const catShops = shops.filter((s) => s.category.key === c.key);
    const occupied = catShops.filter((s) => s.status === "rented" || s.status === "reserved").length;
    return {
      label: locale === "ar" ? c.nameAr : c.nameEn,
      value: catShops.length ? Math.round((occupied / catShops.length) * 100) : 0,
      color: c.colorHex,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-2xl font-extrabold">{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DonutChart data={statusChartData} title={t("shopsByStatus")} />
        <BarChart data={occupancyData} title={t("occupancyByCategory")} />
      </div>
    </div>
  );
}
