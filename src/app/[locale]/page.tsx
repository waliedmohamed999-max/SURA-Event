import { ArrowRight, MapPinned } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { buildPavilionGeometry, PAVILION_STATS } from "@/lib/pavilion-data";
import { PavilionMapExperience } from "@/components/map/PavilionMapExperience";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { toShopDTO } from "@/lib/shop-dto";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export const revalidate = 0;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hero");
  const tMap = await getTranslations("map");
  const tHow = await getTranslations("howItWorks");

  const [shops, categories, statuses] = await Promise.all([
    prisma.shop.findMany({ include: { category: true, geometry: true }, orderBy: { shopNumber: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
    prisma.statusConfig.findMany({ orderBy: { order: "asc" } }),
  ]);

  const { decorativeZones, buildingOutline } = buildPavilionGeometry();
  const availableCount = shops.filter((s) => s.status === "available").length;

  const steps = [
    { step: "1", title: tHow("step1Title"), body: tHow("step1Body") },
    { step: "2", title: tHow("step2Title"), body: tHow("step2Body") },
    { step: "3", title: tHow("step3Title"), body: tHow("step3Body") },
    { step: "4", title: tHow("step4Title"), body: tHow("step4Body") },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-[#0d1f1a] to-primary px-6 py-20 text-primary-foreground md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">{t("title")}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 md:text-lg">{t("subtitle")}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#pavilion-map"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
              >
                <MapPinned className="h-4 w-4" />
                {t("ctaExplore")}
              </a>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t("ctaTrack")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6 text-center">
              <Stat label={t("statTotal")} value={String(shops.length)} />
              <Stat label={t("statAvailable")} value={String(availableCount)} />
              <Stat label={t("statArea")} value={`${PAVILION_STATS.pavilionAreaSqm} m²`} />
            </div>
          </div>
        </section>

        <section id="pavilion-map" className="px-4 py-14 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 text-center md:text-start">
              <h2 className="font-display text-2xl font-bold md:text-3xl">{tMap("title")}</h2>
              <p className="mt-2 text-sm text-muted">{tMap("subtitle")}</p>
            </div>
            <PavilionMapExperience
              shops={shops.map(toShopDTO)}
              categories={categories}
              statuses={statuses}
              decorativeZones={decorativeZones}
              buildingOutline={buildingOutline}
              locale={locale as Locale}
            />
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border bg-surface px-4 py-16 md:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-2xl font-bold md:text-3xl">{tHow("title")}</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-accent md:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}
