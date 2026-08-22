import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const t = useTranslations("nav");

  const navLinks = [
    { href: "/#pavilion-map", label: t("exploreShops") },
    { href: "/#pavilion-map", label: t("categories") },
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/track", label: t("track") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight">
          Global Village <span className="text-accent">Bahrain</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/#pavilion-map"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("applyNow")}
          </Link>
        </div>
      </div>
    </header>
  );
}
