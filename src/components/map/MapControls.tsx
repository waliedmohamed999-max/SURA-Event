"use client";

import { Minus, Plus, RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CategoryDTO, StatusDTO } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

export function MapControls({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  categories,
  statuses,
  onZoomIn,
  onZoomOut,
  onReset,
  colorMode,
  onColorModeChange,
  locale,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: string | null;
  onCategoryChange: (v: string | null) => void;
  status: string | null;
  onStatusChange: (v: string | null) => void;
  categories: CategoryDTO[];
  statuses: StatusDTO[];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  colorMode: "category" | "status";
  onColorModeChange: (v: "category" | "status") => void;
  locale: Locale;
}) {
  const t = useTranslations("map");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-border bg-surface py-2 ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div className="flex items-center rounded-full border border-border bg-surface p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onColorModeChange("category")}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              colorMode === "category" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t("colorByCategory")}
          </button>
          <button
            type="button"
            onClick={() => onColorModeChange("status")}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              colorMode === "status" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t("colorByStatus")}
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={onZoomOut}
            aria-label={t("zoomOut")}
            className="rounded-full p-1.5 hover:bg-background"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label={t("resetView")}
            className="rounded-full p-1.5 hover:bg-background"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label={t("zoomIn")}
            className="rounded-full p-1.5 hover:bg-background"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={category === null} onClick={() => onCategoryChange(null)} label={t("allCategories")} />
        {categories.map((c) => (
          <FilterChip
            key={c.key}
            active={category === c.key}
            onClick={() => onCategoryChange(c.key)}
            label={locale === "ar" ? c.nameAr : c.nameEn}
            dotColor={c.colorHex}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={status === null} onClick={() => onStatusChange(null)} label={t("allStatuses")} />
        {statuses.map((s) => (
          <FilterChip
            key={s.key}
            active={status === s.key}
            onClick={() => onStatusChange(s.key)}
            label={locale === "ar" ? s.labelAr : s.labelEn}
            dotColor={s.colorHex}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground hover:border-accent"
      }`}
    >
      {dotColor && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
      )}
      {label}
    </button>
  );
}

export function MapLegend({
  statuses,
  categories,
  colorMode,
  locale,
}: {
  statuses: StatusDTO[];
  categories: CategoryDTO[];
  colorMode: "category" | "status";
  locale: Locale;
}) {
  const items =
    colorMode === "category"
      ? categories.map((c) => ({ key: c.key, label: locale === "ar" ? c.nameAr : c.nameEn, color: c.colorHex }))
      : statuses.map((s) => ({ key: s.key, label: locale === "ar" ? s.labelAr : s.labelEn, color: s.colorHex }));

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
