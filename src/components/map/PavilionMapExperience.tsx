"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PavilionMap, type PavilionMapHandle } from "./PavilionMap";
import { MapControls, MapLegend } from "./MapControls";
import { ShopTooltip } from "./ShopTooltip";
import { ShopDetailPanel } from "./ShopDetailPanel";
import type { CategoryDTO, DecorativeZoneDTO, ShopDTO, StatusDTO } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

export function PavilionMapExperience({
  shops,
  categories,
  statuses,
  decorativeZones,
  buildingOutline,
  initialSelectedShopId,
  // Portrait on mobile (matches the real building), landscape on desktop
  // (the map is rendered rotated on its side there — see PavilionMap).
  heightClassName = "h-[560px] md:h-[420px] lg:h-[500px]",
  locale,
}: {
  shops: ShopDTO[];
  categories: CategoryDTO[];
  statuses: StatusDTO[];
  decorativeZones: DecorativeZoneDTO[];
  buildingOutline: { x: number; y: number }[];
  initialSelectedShopId?: string;
  heightClassName?: string;
  locale: Locale;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"category" | "status">("category");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(initialSelectedShopId ?? null);
  const [hovered, setHovered] = useState<{ shop: ShopDTO; pos: { x: number; y: number } } | null>(null);
  const mapHandle = useRef<PavilionMapHandle | null>(null);

  const statusByKey = useMemo(() => new Map(statuses.map((s) => [s.key, s])), [statuses]);

  const filteredShops = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shops.filter((s) => {
      if (category && s.category.key !== category) return false;
      if (status && s.status !== status) return false;
      if (term && !s.shopNumber.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [shops, category, status, search]);

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) ?? null,
    [shops, selectedShopId]
  );

  const handleShopClick = useCallback((shop: ShopDTO) => {
    setSelectedShopId(shop.id);
    setHovered(null);
    if (shop.geometry) {
      mapHandle.current?.focusOn(shop.geometry.centerPoint, 2.4);
    }
  }, []);

  const handleShopHover = useCallback((shop: ShopDTO | null, clientPos?: { x: number; y: number }) => {
    if (!shop || !clientPos) {
      setHovered(null);
      return;
    }
    setHovered({ shop, pos: clientPos });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <MapControls
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        categories={categories}
        statuses={statuses}
        onZoomIn={() => mapHandle.current?.zoomIn()}
        onZoomOut={() => mapHandle.current?.zoomOut()}
        onReset={() => mapHandle.current?.reset()}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        locale={locale}
      />

      <div className={`relative w-full ${heightClassName}`}>
        <PavilionMap
          shops={filteredShops}
          decorativeZones={decorativeZones}
          buildingOutline={buildingOutline}
          statusByKey={statusByKey}
          colorMode={colorMode}
          selectedShopId={selectedShopId}
          hoveredShopId={hovered?.shop.id ?? null}
          onShopClick={handleShopClick}
          onShopHover={handleShopHover}
          onReady={(handle) => {
            mapHandle.current = handle;
          }}
          locale={locale}
        />

        {hovered && (
          <div className="hidden md:block">
            <ShopTooltip
              shop={hovered.shop}
              status={statusByKey.get(hovered.shop.status)}
              position={hovered.pos}
              locale={locale}
            />
          </div>
        )}
      </div>

      <MapLegend statuses={statuses} categories={categories} colorMode={colorMode} locale={locale} />

      {selectedShop && (
        <ShopDetailPanel
          shop={selectedShop}
          status={statusByKey.get(selectedShop.status)}
          onClose={() => setSelectedShopId(null)}
          locale={locale}
        />
      )}
    </div>
  );
}
