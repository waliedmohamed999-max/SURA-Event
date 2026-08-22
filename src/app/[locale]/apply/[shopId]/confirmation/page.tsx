import { CheckCircle2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";

export default async function ApplicationConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ number?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("confirmation");
  const { number } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
          <h1 className="mt-4 font-display text-2xl font-bold">{t("success")}</h1>

          {number && (
            <div className="mt-6 rounded-xl bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{t("applicationNumber")}</p>
              <p className="mt-1 font-display text-xl font-bold text-accent" dir="ltr">
                {number}
              </p>
            </div>
          )}

          <p className="mt-6 text-sm text-muted">
            {t("statusLabel")} <span className="font-semibold text-foreground">{t("statusValue")}</span>
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={number ? `/track?number=${encodeURIComponent(number)}` : "/track"}
              className="rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              {t("trackButton")}
            </Link>
            <Link href="/#pavilion-map" className="rounded-full border border-border py-3 text-sm font-semibold">
              {t("backButton")}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
