"use client";

import { useEffect, useMemo } from "react";
import type { DecorativeZoneDTO, ShopDTO, StatusDTO } from "@/lib/types";
import { MAP_VIEWBOX } from "@/lib/pavilion-data";
import { rotateDecorativeZones, rotateOutline, rotateShops, rotateViewBox } from "@/lib/rotate-map";
import { usePanZoom } from "./usePanZoom";
import { useIsDesktop } from "./useIsDesktop";

function pointsToSvg(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function polygonTopRight(points: { x: number; y: number }[]) {
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  return { x: maxX, y: minY };
}

export interface PavilionMapHandle {
  focusOn: (point: { x: number; y: number }, scale?: number) => void;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function PavilionMap({
  shops,
  decorativeZones,
  buildingOutline,
  statusByKey,
  colorMode,
  selectedShopId,
  hoveredShopId,
  onShopClick,
  onShopHover,
  onReady,
  locale = "en",
}: {
  shops: ShopDTO[];
  decorativeZones: DecorativeZoneDTO[];
  buildingOutline: { x: number; y: number }[];
  statusByKey: Map<string, StatusDTO>;
  colorMode: "category" | "status";
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onShopClick: (shop: ShopDTO) => void;
  onShopHover: (shop: ShopDTO | null, clientPos?: { x: number; y: number }) => void;
  onReady?: (handle: PavilionMapHandle) => void;
  locale?: "en" | "ar";
}) {
  // The pavilion is naturally tall and narrow (matches the real building).
  // On desktop that wastes most of a wide viewport, so it's displayed
  // rotated on its side there; mobile keeps the true portrait proportions.
  // The rotation is applied to the coordinate data itself (not a CSS
  // transform on the SVG), so pan/zoom/click math never has to reason
  // about a rotated element.
  const isDesktop = useIsDesktop();

  const viewBox = useMemo(
    () => (isDesktop ? rotateViewBox(MAP_VIEWBOX) : MAP_VIEWBOX),
    [isDesktop]
  );
  const renderShops = useMemo(
    () => (isDesktop ? rotateShops(shops, MAP_VIEWBOX.width) : shops),
    [isDesktop, shops]
  );
  const renderZones = useMemo(
    () => (isDesktop ? rotateDecorativeZones(decorativeZones, MAP_VIEWBOX.width) : decorativeZones),
    [isDesktop, decorativeZones]
  );
  const renderOutline = useMemo(
    () => (isDesktop ? rotateOutline(buildingOutline, MAP_VIEWBOX.width) : buildingOutline),
    [isDesktop, buildingOutline]
  );

  const { svgRef, transform, handlers, zoomIn, zoomOut, reset, focusOn } = usePanZoom(viewBox);

  useEffect(() => {
    onReady?.({ focusOn, reset, zoomIn, zoomOut });
  }, [onReady, focusOn, reset, zoomIn, zoomOut]);

  return (
    <div className="relative h-full w-full touch-none select-none overflow-hidden rounded-2xl bg-[#EEF2EE]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={handlers.onWheel}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
      >
        <g
          className="map-transition"
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
          <polygon
            points={pointsToSvg(renderOutline)}
            fill="#ffffff"
            stroke="#3f4a3f"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {renderZones.map((zone) => (
            <g key={zone.key} className="pointer-events-none">
              <polygon
                points={pointsToSvg(zone.polygonPoints)}
                fill="none"
                stroke="#9CA79C"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
              <text
                x={zone.labelPosition.x}
                y={zone.labelPosition.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="#6b6459"
              >
                {locale === "ar" ? zone.labelAr : zone.labelEn}
              </text>
            </g>
          ))}

          {renderShops.map((shop) => {
            if (!shop.geometry) return null;
            const status = statusByKey.get(shop.status);
            const statusColor = status?.colorHex ?? "#9CA3AF";
            const fillColor = colorMode === "category" ? shop.category.colorHex : statusColor;
            const isSelected = shop.id === selectedShopId;
            const isHovered = shop.id === hoveredShopId;
            const dot = colorMode === "category" ? polygonTopRight(shop.geometry.polygonPoints) : null;

            return (
              <g
                key={shop.id}
                onClick={() => onShopClick(shop)}
                onPointerEnter={(e) => onShopHover(shop, { x: e.clientX, y: e.clientY })}
                onPointerMove={(e) => onShopHover(shop, { x: e.clientX, y: e.clientY })}
                onPointerLeave={() => onShopHover(null)}
                className="cursor-pointer"
              >
                <polygon
                  points={pointsToSvg(shop.geometry.polygonPoints)}
                  fill={fillColor}
                  fillOpacity={isHovered || isSelected ? 0.95 : 0.78}
                  stroke={isSelected ? "#10241f" : "#ffffff"}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-[fill-opacity,stroke-width] duration-150"
                />
                <text
                  x={shop.geometry.labelPosition.x}
                  y={shop.geometry.labelPosition.y - (shop.area ? 7 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill="#ffffff"
                  className="pointer-events-none"
                  style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 2 }}
                >
                  {shop.shopNumber}
                </text>
                {shop.area && (
                  <text
                    x={shop.geometry.labelPosition.x}
                    y={shop.geometry.labelPosition.y + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fontWeight={600}
                    fill="#ffffff"
                    className="pointer-events-none"
                    style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 1.5 }}
                  >
                    {shop.area} SQM
                  </text>
                )}
                {dot && (
                  <circle
                    cx={dot.x - 3}
                    cy={dot.y + 3}
                    r={4}
                    fill={statusColor}
                    stroke="#ffffff"
                    strokeWidth={1.2}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
