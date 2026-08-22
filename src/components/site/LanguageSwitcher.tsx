"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const t = useTranslations("langSwitch");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: "ar" })}
        className={locale === "ar" ? "text-accent" : "text-foreground/60 hover:text-foreground"}
      >
        {t("ar")}
      </button>
      <span className="text-foreground/30">|</span>
      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: "en" })}
        className={locale === "en" ? "text-accent" : "text-foreground/60 hover:text-foreground"}
      >
        {t("en")}
      </button>
    </div>
  );
}
