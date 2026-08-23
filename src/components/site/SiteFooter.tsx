import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-primary px-4 py-10 text-primary-foreground/70 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-sm md:flex-row">
        <p>{t("rights", { year: new Date().getFullYear() })}</p>
        <p>{t("operatedBy")}</p>
        <p>{t("sourceNote")}</p>
      </div>
    </footer>
  );
}
