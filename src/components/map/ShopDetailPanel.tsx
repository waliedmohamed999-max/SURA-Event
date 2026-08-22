"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, MapPin, Ruler, Tag, Clock } from "lucide-react";
import type { ShopDTO, StatusDTO } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

function unavailableMessageKey(status: string): "statusRented" | "statusReserved" | "statusPending" | "statusOther" {
  switch (status) {
    case "rented":
      return "statusRented";
    case "reserved":
    case "approved":
      return "statusReserved";
    case "application_pending":
    case "under_review":
      return "statusPending";
    default:
      return "statusOther";
  }
}

export function ShopDetailPanel({
  shop,
  status,
  onClose,
  locale,
}: {
  shop: ShopDTO;
  status: StatusDTO | undefined;
  onClose: () => void;
  locale: Locale;
}) {
  const t = useTranslations("shop");
  const isAvailable = shop.status === "available";
  const categoryName = locale === "ar" ? shop.category.nameAr : shop.category.nameEn;
  const statusName = status ? (locale === "ar" ? status.labelAr : status.labelEn) : undefined;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-2xl md:inset-y-0 md:inset-x-auto md:end-0 md:h-full md:max-h-none md:w-[400px] md:rounded-t-none md:rounded-s-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{categoryName}</p>
            <h2 className="font-display text-2xl font-bold">{t("shopLabel", { number: shop.shopNumber })}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-background">
            <X className="h-5 w-5" />
          </button>
        </div>

        {status && (
          <span
            className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: status.colorHex }}
          >
            {statusName}
          </span>
        )}

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Ruler className="h-4 w-4 text-muted" />
            <dt className="text-muted">{t("area")}</dt>
            <dd className="ms-auto font-medium">{shop.area ? `${shop.area} m²` : t("areaUnspecified")}</dd>
          </div>
          {(shop.width || shop.height) && (
            <div className="flex items-center gap-3">
              <Ruler className="h-4 w-4 text-muted" />
              <dt className="text-muted">{t("dimensions")}</dt>
              <dd className="ms-auto font-medium">
                {shop.width ?? "—"}m × {shop.height ?? "—"}m
              </dd>
            </div>
          )}
          {shop.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted" />
              <dt className="text-muted">{t("location")}</dt>
              <dd className="ms-auto text-end font-medium">{shop.location}</dd>
            </div>
          )}
          {shop.rentalPrice && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted" />
              <dt className="text-muted">{t("rentalPrice")}</dt>
              <dd className="ms-auto font-medium">BHD {shop.rentalPrice}</dd>
            </div>
          )}
          {shop.rentalPeriod && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted" />
              <dt className="text-muted">{t("rentalPeriod")}</dt>
              <dd className="ms-auto font-medium">{shop.rentalPeriod}</dd>
            </div>
          )}
        </dl>

        {shop.description && <p className="mt-4 text-sm text-muted">{shop.description}</p>}

        {shop.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {shop.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={t("shopLabel", { number: shop.shopNumber })} className="aspect-square rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6">
          {isAvailable ? (
            <Link
              href={`/apply/${shop.id}`}
              className="block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("apply")}
            </Link>
          ) : (
            <p className="rounded-xl bg-background p-4 text-sm text-muted">{t(unavailableMessageKey(shop.status))}</p>
          )}
        </div>
      </div>
    </>
  );
}
