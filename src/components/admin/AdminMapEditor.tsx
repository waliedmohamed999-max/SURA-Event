"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MAP_VIEWBOX } from "@/lib/pavilion-data";
import { usePanZoom } from "@/components/map/usePanZoom";
import type { CategoryDTO, DecorativeZoneDTO, ShopDTO, StatusDTO } from "@/lib/types";

type Point = { x: number; y: number };

function pointsToSvg(points: Point[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function centerOf(points: Point[]): Point {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

function defaultSquare(): Point[] {
  const c = MAP_VIEWBOX.width / 2;
  return [
    { x: c - 20, y: 300 },
    { x: c + 20, y: 300 },
    { x: c + 20, y: 340 },
    { x: c - 20, y: 340 },
  ];
}

export function AdminMapEditor({
  shops: initialShops,
  categories,
  statuses,
  decorativeZones,
  buildingOutline,
}: {
  shops: ShopDTO[];
  categories: CategoryDTO[];
  statuses: StatusDTO[];
  decorativeZones: DecorativeZoneDTO[];
  buildingOutline: Point[];
}) {
  const t = useTranslations("admin.mapEditor");
  const [shops, setShops] = useState(initialShops);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addingNumber, setAddingNumber] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { svgRef, transform, handlers } = usePanZoom(MAP_VIEWBOX);
  const statusByKey = useMemo(() => new Map(statuses.map((s) => [s.key, s])), [statuses]);

  const dragRef = useRef<{
    kind: "move" | "vertex";
    shopId: string;
    vertexIndex?: number;
    startClientX: number;
    startClientY: number;
    startPoints: Point[];
  } | null>(null);

  const selectedShop = shops.find((s) => s.id === selectedId) ?? null;

  function updateShopPoints(shopId: string, points: Point[]) {
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId && s.geometry
          ? { ...s, geometry: { ...s.geometry, polygonPoints: points, centerPoint: centerOf(points), labelPosition: centerOf(points) } }
          : s
      )
    );
    setDirty(true);
  }

  function onShapePointerDown(e: React.PointerEvent, shop: ShopDTO) {
    if (!shop.geometry) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelectedId(shop.id);
    dragRef.current = {
      kind: "move",
      shopId: shop.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPoints: shop.geometry.polygonPoints,
    };
  }

  function onVertexPointerDown(e: React.PointerEvent, shop: ShopDTO, index: number) {
    if (!shop.geometry) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      kind: "vertex",
      shopId: shop.id,
      vertexIndex: index,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPoints: shop.geometry.polygonPoints,
    };
  }

  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) {
      handlers.onPointerMove(e);
      return;
    }
    const dx = (e.clientX - drag.startClientX) / transform.scale;
    const dy = (e.clientY - drag.startClientY) / transform.scale;

    if (drag.kind === "move") {
      updateShopPoints(
        drag.shopId,
        drag.startPoints.map((p) => ({ x: p.x + dx, y: p.y + dy }))
      );
    } else if (drag.kind === "vertex" && drag.vertexIndex !== undefined) {
      const next = drag.startPoints.map((p, i) =>
        i === drag.vertexIndex ? { x: p.x + dx, y: p.y + dy } : p
      );
      updateShopPoints(drag.shopId, next);
    }
  }

  function onSvgPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = null;
    handlers.onPointerUp(e);
  }

  async function saveSelectedShop() {
    if (!selectedShop) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/shops/${selectedShop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopNumber: selectedShop.shopNumber,
          categoryId: selectedShop.category.id,
          area: selectedShop.area,
          location: selectedShop.location,
          status: selectedShop.status,
          rentalPrice: selectedShop.rentalPrice,
          rentalPeriod: selectedShop.rentalPeriod,
          description: selectedShop.description,
          geometry: selectedShop.geometry
            ? {
                polygonPoints: selectedShop.geometry.polygonPoints,
                centerPoint: selectedShop.geometry.centerPoint,
                labelPosition: selectedShop.geometry.labelPosition,
                rotation: selectedShop.geometry.rotation,
              }
            : undefined,
        }),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function patchSelectedField<K extends keyof ShopDTO>(key: K, value: ShopDTO[K]) {
    if (!selectedId) return;
    setShops((prev) => prev.map((s) => (s.id === selectedId ? { ...s, [key]: value } : s)));
    setDirty(true);
  }

  async function addShop() {
    if (!addingNumber.trim() || categories.length === 0) return;
    const res = await fetch("/api/admin/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopNumber: addingNumber.trim(),
        categoryId: categories[0].id,
        geometry: {
          polygonPoints: defaultSquare(),
          centerPoint: centerOf(defaultSquare()),
          labelPosition: centerOf(defaultSquare()),
          rotation: 0,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setShops((prev) => [...prev, data.shop]);
      setSelectedId(data.shop.id);
      setAddingNumber("");
      setShowAddForm(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-border bg-[#EEF2EE]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onWheel={handlers.onWheel}
          onPointerDown={handlers.onPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          onPointerCancel={onSvgPointerUp}
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            <polygon points={pointsToSvg(buildingOutline)} fill="#ffffff" stroke="#3f4a3f" strokeWidth={2.5} />

            {decorativeZones.map((zone) => (
              <polygon
                key={zone.key}
                points={pointsToSvg(zone.polygonPoints)}
                fill="none"
                stroke="#9CA79C"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                className="pointer-events-none"
              />
            ))}

            {shops.map((shop) => {
              if (!shop.geometry) return null;
              const status = statusByKey.get(shop.status);
              const isSelected = shop.id === selectedId;
              return (
                <g key={shop.id}>
                  <polygon
                    points={pointsToSvg(shop.geometry.polygonPoints)}
                    fill={status?.colorHex ?? "#9CA3AF"}
                    fillOpacity={isSelected ? 0.95 : 0.75}
                    stroke={isSelected ? "#10241f" : "#ffffff"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-move"
                    onPointerDown={(e) => onShapePointerDown(e, shop)}
                  />
                  <text
                    x={shop.geometry.labelPosition.x}
                    y={shop.geometry.labelPosition.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="#fff"
                    className="pointer-events-none"
                    style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 2 }}
                  >
                    {shop.shopNumber}
                  </text>
                  {isSelected &&
                    shop.geometry.polygonPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={6}
                        fill="#b8912f"
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onPointerDown={(e) => onVertexPointerDown(e, shop, i)}
                      />
                    ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="w-full rounded-full border border-border py-2 text-xs font-semibold"
          >
            {t("addShop")}
          </button>
          {showAddForm && (
            <div className="mt-3 flex gap-2">
              <input
                value={addingNumber}
                onChange={(e) => setAddingNumber(e.target.value)}
                placeholder={t("newShopNumber")}
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={addShop}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                {t("create")}
              </button>
            </div>
          )}
        </div>

        {selectedShop ? (
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <h3 className="font-display text-sm font-bold">
              {t("shopLabel")} {selectedShop.shopNumber}
            </h3>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("category")}</label>
              <select
                value={selectedShop.category.id}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  if (cat) patchSelectedField("category", cat);
                }}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("status")}</label>
              <select
                value={selectedShop.status}
                onChange={(e) => patchSelectedField("status", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("area")}</label>
              <input
                type="number"
                value={selectedShop.area ?? ""}
                onChange={(e) => patchSelectedField("area", e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("rentalPrice")}</label>
              <input
                type="number"
                value={selectedShop.rentalPrice ?? ""}
                onChange={(e) => patchSelectedField("rentalPrice", e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("rentalPeriod")}</label>
              <input
                value={selectedShop.rentalPeriod ?? ""}
                onChange={(e) => patchSelectedField("rentalPeriod", e.target.value || null)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">{t("description")}</label>
              <textarea
                value={selectedShop.description ?? ""}
                onChange={(e) => patchSelectedField("description", e.target.value || null)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>

            <p className="text-xs text-muted">{t("dragHint")}</p>

            <button
              type="button"
              disabled={saving || !dirty}
              onClick={saveSelectedShop}
              className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? t("saving") : t("saveChanges")}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            {t("selectHint")}
          </div>
        )}
      </div>
    </div>
  );
}
