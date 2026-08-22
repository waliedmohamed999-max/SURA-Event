"use client";

import { useTranslations } from "next-intl";
import type { ShopDTO, StatusDTO } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

export function ShopTooltip({
  shop,
  status,
  position,
  locale,
}: {
  shop: ShopDTO;
  status: StatusDTO | undefined;
  position: { x: number; y: number };
  locale: Locale;
}) {
  const t = useTranslations("shop");

  return (
    <div
      className="pointer-events-none fixed z-50 w-56 rounded-xl border border-border bg-surface p-3 shadow-lg"
      style={{ insetInlineStart: position.x + 16, top: position.y + 16 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-bold">{t("shopLabel", { number: shop.shopNumber })}</span>
        {status && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: status.colorHex }}
          >
            {locale === "ar" ? status.labelAr : status.labelEn}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">{locale === "ar" ? shop.category.nameAr : shop.category.nameEn}</p>
      {shop.area && <p className="text-xs text-muted">{shop.area} m²</p>}
    </div>
  );
}
