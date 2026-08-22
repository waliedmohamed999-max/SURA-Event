import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  // Arabic (the default) is served with no URL prefix, e.g. "/" and "/apply/x".
  // English lives under "/en/..." since it's the secondary language here.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
