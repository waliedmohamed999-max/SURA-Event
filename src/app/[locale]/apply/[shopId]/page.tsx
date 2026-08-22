import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { toShopDTO } from "@/lib/shop-dto";
import { ApplicationForm } from "@/components/apply/ApplicationForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ shopId: string; locale: string }>;
}) {
  const { shopId, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("apply");

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { category: true, geometry: true },
  });

  if (!shop) notFound();

  const dto = toShopDTO(shop);
  const isAvailable = dto.status === "available";
  const categoryName = locale === "ar" ? dto.category.nameAr : dto.category.nameEn;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-12 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold">{t("title", { number: dto.shopNumber })}</h1>
          <p className="mt-2 text-sm text-muted">{categoryName}</p>

          {isAvailable ? (
            <div className="mt-8">
              <ApplicationForm shop={dto} locale={locale as Locale} />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
              {t("notAvailableTitle")}{" "}
              <Link href="/#pavilion-map" className="font-semibold text-accent underline">
                {t("browseOthers")}
              </Link>
              .
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
