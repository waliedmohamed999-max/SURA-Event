/**
 * Source-of-truth static data extracted from the supplied CAD scan:
 * "P-6 ROA pavilion layout Revise 30-09-2025" (Ground Floor Plan).
 *
 * Framework-agnostic on purpose (no Next.js imports) so it can be imported
 * both by `prisma/seed.ts` (via tsx) and by application code.
 *
 * What is real vs. schematic:
 * - Shop count (31), shop numbers, category per shop, and areas are read
 *   directly from the source. Two areas (units 25 and 30) were not cleanly
 *   legible in the scan and are left `null` — see AREA_UNRESOLVED below.
 * - Geometry (polygon coordinates) is NOT pixel-traced from the scan (it's a
 *   rotated scanned CAD export, not vector source). Instead it's generated
 *   here as a clean, unrotated ("north-up") schematic that preserves the
 *   real topology: shop count, category per shop, left/right column order,
 *   bottom F&B row, and the central accessories island — with box sizes
 *   proportioned to each shop's real area. An admin can refine exact
 *   coordinates later in the map editor (Phase 2) without touching this
 *   business data.
 */

export type CategoryKey =
  | "perfumes"
  | "accessories_gifts"
  | "food_products_nuts"
  | "clothing"
  | "fnb";

export interface CategorySeed {
  key: CategoryKey;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  colorHex: string;
  displayOrder: number;
}

export const CATEGORIES: CategorySeed[] = [
  {
    key: "perfumes",
    nameEn: "Perfumes",
    nameAr: "عطور",
    descriptionEn: "Fragrance and perfume retailers",
    descriptionAr: "محلات العطور",
    icon: "sparkles",
    colorHex: "#16A34A",
    displayOrder: 1,
  },
  {
    key: "clothing",
    nameEn: "Clothing",
    nameAr: "ملابس",
    descriptionEn: "Apparel and fashion retailers",
    descriptionAr: "محلات الملابس",
    icon: "shirt",
    colorHex: "#7C3AED",
    displayOrder: 2,
  },
  {
    key: "accessories_gifts",
    nameEn: "Accessories & Gifts",
    nameAr: "اكسسوارات وهدايا",
    descriptionEn: "Accessories, gifts and novelty items",
    descriptionAr: "محلات الاكسسوارات والهدايا",
    icon: "gift",
    colorHex: "#E11D48",
    displayOrder: 3,
  },
  {
    key: "food_products_nuts",
    nameEn: "Food Products & Nuts",
    nameAr: "منتجات غذائية ومكسرات",
    descriptionEn: "Packaged food, snacks and nuts",
    descriptionAr: "المنتجات الغذائية والمكسرات",
    icon: "nut",
    colorHex: "#2563EB",
    displayOrder: 4,
  },
  {
    key: "fnb",
    nameEn: "F&B / Restaurants & Cafes",
    nameAr: "مطاعم وكافيهات",
    descriptionEn: "Restaurants, cafes and beverage outlets",
    descriptionAr: "المطاعم والمقاهي",
    icon: "utensils",
    colorHex: "#D97706",
    displayOrder: 5,
  },
];

export type ShopStatusKey =
  | "available"
  | "application_pending"
  | "under_review"
  | "approved"
  | "rented"
  | "reserved"
  | "unavailable";

export interface StatusSeed {
  key: ShopStatusKey;
  labelEn: string;
  labelAr: string;
  colorHex: string;
  order: number;
}

export const STATUS_CONFIG: StatusSeed[] = [
  { key: "available", labelEn: "Available", labelAr: "متاح", colorHex: "#22C55E", order: 1 },
  { key: "application_pending", labelEn: "Application Pending", labelAr: "قيد التقديم", colorHex: "#F59E0B", order: 2 },
  { key: "under_review", labelEn: "Under Review", labelAr: "قيد المراجعة", colorHex: "#3B82F6", order: 3 },
  { key: "approved", labelEn: "Approved", labelAr: "تمت الموافقة", colorHex: "#06B6D4", order: 4 },
  { key: "reserved", labelEn: "Reserved", labelAr: "محجوز", colorHex: "#8B5CF6", order: 5 },
  { key: "rented", labelEn: "Rented", labelAr: "مؤجر", colorHex: "#991B1B", order: 6 },
  { key: "unavailable", labelEn: "Unavailable", labelAr: "غير متاح", colorHex: "#6B7280", order: 7 },
];

export interface ShopSeed {
  shopNumber: string;
  categoryKey: CategoryKey;
  /** sqm from the source scan; null where not legibly extractable (kept configurable in admin, never invented) */
  area: number | null;
  location: string;
}

/** Shop numbers whose exact area digit was not cleanly legible in the scan. */
export const AREA_UNRESOLVED = new Set(["25", "30"]);

const pad = (n: number) => String(n).padStart(2, "0");

export const SHOPS: ShopSeed[] = [
  // Top corners / left column (front facade -> rear), Perfumes then Clothing
  { shopNumber: pad(1), categoryKey: "perfumes", area: 12, location: "Left column, near front facade" },
  { shopNumber: pad(2), categoryKey: "perfumes", area: 12, location: "Left column, near front facade" },
  { shopNumber: pad(3), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(4), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(5), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(6), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(7), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(8), categoryKey: "clothing", area: 9, location: "Left column" },
  { shopNumber: pad(9), categoryKey: "clothing", area: 9, location: "Left column" },
  // Bottom of left column, then the horizontal bottom row, F&B
  { shopNumber: pad(10), categoryKey: "fnb", area: 9, location: "Left column, bottom" },
  { shopNumber: pad(11), categoryKey: "fnb", area: 24, location: "Bottom row" },
  { shopNumber: pad(12), categoryKey: "fnb", area: 9, location: "Bottom row" },
  { shopNumber: pad(13), categoryKey: "fnb", area: 9, location: "Bottom row, near rear entrance" },
  { shopNumber: pad(14), categoryKey: "fnb", area: 14.7, location: "Right column, bottom, near rear entrance" },
  { shopNumber: pad(15), categoryKey: "fnb", area: 9, location: "Right column" },
  // Right column (rear -> front facade), Food Products & Nuts then Perfumes
  { shopNumber: pad(16), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(17), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(18), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(19), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(20), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(21), categoryKey: "food_products_nuts", area: 9, location: "Right column" },
  { shopNumber: pad(22), categoryKey: "food_products_nuts", area: 9.5, location: "Right column" },
  { shopNumber: pad(23), categoryKey: "perfumes", area: 12, location: "Right column, near front facade" },
  { shopNumber: pad(24), categoryKey: "perfumes", area: 12, location: "Right column, near front facade" },
  // Central island, Accessories & Gifts
  { shopNumber: pad(25), categoryKey: "accessories_gifts", area: null, location: "Central island" },
  { shopNumber: pad(26), categoryKey: "accessories_gifts", area: 9, location: "Central island" },
  { shopNumber: pad(27), categoryKey: "accessories_gifts", area: 9, location: "Central island" },
  { shopNumber: pad(28), categoryKey: "accessories_gifts", area: 9, location: "Central island" },
  { shopNumber: pad(29), categoryKey: "accessories_gifts", area: 9, location: "Central island" },
  { shopNumber: pad(30), categoryKey: "accessories_gifts", area: null, location: "Central island" },
  { shopNumber: pad(31), categoryKey: "accessories_gifts", area: 9, location: "Central island" },
];

export const PAVILION_STATS = {
  nameEn: "Asia Road (P6-ROA Pavilion) — Global Village Dammam",
  nameAr: "طريق آسيا (جناح P6-ROA) — القرية العالمية بالدمام",
  pavilionAreaSqm: 650,
  commercialAreaSqm: 311.6,
  passageAreaSqm: 323,
  officeAreaSqm: 12,
};

// ---------------------------------------------------------------------------
// Schematic geometry generation
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface ShopGeometrySeed {
  shopNumber: string;
  polygonPoints: Point[];
  centerPoint: Point;
  labelPosition: Point;
  rotation: number;
}

/** Non-leasable decorative zones rendered on the map but not stored as Shop rows. */
export interface DecorativeZone {
  key: string;
  labelEn: string;
  labelAr: string;
  polygonPoints: Point[];
  labelPosition: Point;
}

// Shop geometry fills y:[0, SHOP_AREA_HEIGHT]; the extra bottom margin holds
// the rear administration office, which sits just outside the main shop
// rectangle in the source plan. PAD_* leaves room around that for the
// building's outer wall outline (including the peaked front facade), which
// extends slightly beyond the shop grid on every side.
const SHOP_AREA_WIDTH = 480;
const SHOP_AREA_HEIGHT = 1200;
const ADMIN_MARGIN = 50;
const PAD_TOP = 60;
const PAD_SIDE = 20;
const PAD_BOTTOM = 10;
export const MAP_VIEWBOX = {
  width: SHOP_AREA_WIDTH + PAD_SIDE * 2,
  height: SHOP_AREA_HEIGHT + ADMIN_MARGIN + PAD_TOP + PAD_BOTTOM,
};

function rect(x: number, y: number, w: number, h: number): Point[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

function center(points: Point[]): Point {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

/** Lay out shops top-to-bottom in a fixed-width vertical band, sized proportionally to area. */
function layoutColumn(
  shopNumbers: string[],
  x: number,
  yStart: number,
  yEnd: number,
  width: number
): Map<string, Point[]> {
  const byNumber = new Map(SHOPS.map((s) => [s.shopNumber, s]));
  const weights = shopNumbers.map((n) => byNumber.get(n)?.area ?? 9);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalHeight = yEnd - yStart;
  const gap = 4;
  const usableHeight = totalHeight - gap * (shopNumbers.length - 1);

  const result = new Map<string, Point[]>();
  let y = yStart;
  shopNumbers.forEach((num, i) => {
    const h = (weights[i] / totalWeight) * usableHeight;
    result.set(num, rect(x, y, width, h));
    y += h + gap;
  });
  return result;
}

/** Lay out shops left-to-right in a fixed-height horizontal band, sized proportionally to area. */
function layoutRow(
  shopNumbers: string[],
  xStart: number,
  xEnd: number,
  y: number,
  height: number
): Map<string, Point[]> {
  const byNumber = new Map(SHOPS.map((s) => [s.shopNumber, s]));
  const weights = shopNumbers.map((n) => byNumber.get(n)?.area ?? 9);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalWidth = xEnd - xStart;
  const gap = 4;
  const usableWidth = totalWidth - gap * (shopNumbers.length - 1);

  const result = new Map<string, Point[]>();
  let x = xStart;
  shopNumbers.forEach((num, i) => {
    const w = (weights[i] / totalWeight) * usableWidth;
    result.set(num, rect(x, y, w, height));
    x += w + gap;
  });
  return result;
}

export function buildPavilionGeometry(): {
  shops: ShopGeometrySeed[];
  decorativeZones: DecorativeZone[];
  buildingOutline: Point[];
} {
  const COLUMN_WIDTH = 100;
  const ROW_HEIGHT = 110;
  const TOP_MARGIN = 90;
  const width = SHOP_AREA_WIDTH;
  const height = SHOP_AREA_HEIGHT;

  // The left run is a single unbroken vertical column all the way down to
  // unit 10. On the right, the column doesn't stop at 16 — units 15 and 14
  // continue the exact same unbroken vertical strip down to the rear wall
  // (confirmed against a close-up of the source: 16/15/14 share one
  // continuous edge, not a separate horizontal row). Only 11/12/13 actually
  // form a horizontal run along the bottom, between the two columns.
  const leftColumn = layoutColumn(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pad),
    0,
    TOP_MARGIN,
    height - ROW_HEIGHT,
    COLUMN_WIDTH
  );
  const rightColumnNumbers = [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14].map(pad);
  const rightColumn = layoutColumn(rightColumnNumbers, width - COLUMN_WIDTH, TOP_MARGIN, height, COLUMN_WIDTH);
  // Central accessories island: all 7 units (25-31) stacked directly on top
  // of one another in a single column, full island width each — not paired
  // side by side. The source shows two "ممر" (corridor) breaks running
  // through this stack: one after unit 27, one after unit 29.
  const islandX = 185;
  const islandWidth = 110;
  const islandGap = 4;
  const islandCorridorGap = 22;
  const islandPolys = new Map<string, Point[]>();
  let islandY = 170;

  const islandOrder = [25, 26, 27, 28, 29, 30, 31].map(pad);
  const corridorAfter = new Set([pad(27), pad(29)]);
  const unitHeight = 100;
  const corridorGapCenters: number[] = [];

  for (const num of islandOrder) {
    islandPolys.set(num, rect(islandX, islandY, islandWidth, unitHeight));
    islandY += unitHeight;
    if (corridorAfter.has(num)) {
      corridorGapCenters.push(islandY + islandCorridorGap / 2);
      islandY += islandCorridorGap;
    } else {
      islandY += islandGap;
    }
  }

  const islandCenterX = islandX + islandWidth / 2;

  // Only 11/12/13 form the horizontal run along the bottom — 10 belongs to
  // the left column above it and 14 belongs to the right column beside it
  // (see the column definitions above). The rear entrance sits in the gap
  // between 13 and the right column, not centered under the island.
  const BOTTOM_ENTRANCE_WIDTH = 40;
  const bottomEntranceEnd = width - COLUMN_WIDTH;
  const bottomEntranceStart = bottomEntranceEnd - BOTTOM_ENTRANCE_WIDTH;
  const bottomRow = layoutRow(
    [11, 12, 13].map(pad),
    0,
    bottomEntranceStart,
    height - ROW_HEIGHT,
    ROW_HEIGHT
  );

  // Unit 10 stays a plain, complete square (confirmed against a close-up of
  // the source — it is not notched). Unit 11 is the one drawn as an
  // L-shaped polygon: it extends up alongside 10's outer-wall (left) edge
  // by a small step (~1.9m tall x ~3m wide in the source). That step is
  // simply open floor next to 10, not part of 10's own footprint.
  const METERS_TO_UNITS = SHOP_AREA_WIDTH / 15.36; // top facade width is 15.36m in the source
  const NOTCH_HEIGHT = 1.9 * METERS_TO_UNITS;
  const NOTCH_WIDTH = 3 * METERS_TO_UNITS;
  const columnBottomY = height - ROW_HEIGHT;
  const shop11Key = pad(11);

  const shop11Poly = bottomRow.get(shop11Key)!;
  const shop11Right = Math.max(...shop11Poly.map((p) => p.x));
  bottomRow.set(shop11Key, [
    { x: 0, y: columnBottomY - NOTCH_HEIGHT },
    { x: NOTCH_WIDTH, y: columnBottomY - NOTCH_HEIGHT },
    { x: NOTCH_WIDTH, y: columnBottomY },
    { x: shop11Right, y: columnBottomY },
    { x: shop11Right, y: height },
    { x: 0, y: height },
  ]);

  const allPolys = new Map<string, Point[]>([
    ...leftColumn,
    ...rightColumn,
    ...bottomRow,
    ...islandPolys,
  ]);

  const shops: ShopGeometrySeed[] = SHOPS.map((s) => {
    const poly = allPolys.get(s.shopNumber);
    if (!poly) throw new Error(`No geometry generated for shop ${s.shopNumber}`);
    const c = center(poly);
    return {
      shopNumber: s.shopNumber,
      polygonPoints: poly,
      centerPoint: c,
      labelPosition: c,
      rotation: 0,
    };
  });

  // Administration / back-of-house office (not leasable), rendered for layout
  // accuracy only — sits just outside the main shop rectangle at the rear,
  // as in the source plan, in the small margin strip below the shop area.
  const administrationZone: DecorativeZone = {
    key: "administration",
    labelEn: "Administration",
    labelAr: "الإدارة",
    polygonPoints: rect(width - 130, height + 6, 110, ADMIN_MARGIN - 12),
    labelPosition: { x: width - 75, y: height + ADMIN_MARGIN / 2 },
  };

  // The source shows three entrances along the front facade (left, center,
  // right) plus one rear entrance at the bottom — not a single generic door.
  const ENTRANCE_WIDTH = 44;
  const ENTRANCE_HEIGHT = TOP_MARGIN - 20;
  const topEntranceX = [70, width / 2 - ENTRANCE_WIDTH / 2, width - 70 - ENTRANCE_WIDTH];
  const topEntranceZones: DecorativeZone[] = topEntranceX.map((x, i) => ({
    key: `entrance-top-${i}`,
    labelEn: "Entrance",
    labelAr: "مدخل",
    polygonPoints: rect(x, 4, ENTRANCE_WIDTH, ENTRANCE_HEIGHT),
    labelPosition: { x: x + ENTRANCE_WIDTH / 2, y: 4 + ENTRANCE_HEIGHT / 2 },
  }));

  const bottomEntranceZone: DecorativeZone = {
    key: "entrance-bottom",
    labelEn: "Entrance",
    labelAr: "مدخل",
    polygonPoints: rect(bottomEntranceStart, height - ROW_HEIGHT, BOTTOM_ENTRANCE_WIDTH, ROW_HEIGHT),
    labelPosition: { x: bottomEntranceStart + BOTTOM_ENTRANCE_WIDTH / 2, y: height - ROW_HEIGHT / 2 },
  };

  // The source labels the two breaks running through the accessories island
  // "ممر" (corridor/passage) — open floor cutting through the stack, not a
  // shop. Positioned exactly on the two gaps computed above.
  const corridorZones: DecorativeZone[] = corridorGapCenters.map((y, i) => ({
    key: `corridor-${i}`,
    labelEn: "Corridor",
    labelAr: "ممر",
    polygonPoints: rect(islandX - 40, y - 10, islandWidth + 80, 20),
    labelPosition: { x: islandCenterX, y },
  }));

  // Outer building wall outline — a peaked front facade (matching the
  // "FRONT FACADE" arrow marker in the source) plus a recessed notch in the
  // rear wall where the bottom entrance cuts through. This is what actually
  // reads as "a building" rather than a loose grid of colored boxes.
  const WALL = 14;
  const PEAK_HALF_WIDTH = 90;
  const PEAK_HEIGHT = 22;
  const NOTCH_DEPTH = ROW_HEIGHT + 6;
  const buildingOutlineRaw: Point[] = [
    { x: -WALL, y: 55 },
    { x: width / 2 - PEAK_HALF_WIDTH, y: -WALL },
    { x: width / 2, y: -WALL - PEAK_HEIGHT },
    { x: width / 2 + PEAK_HALF_WIDTH, y: -WALL },
    { x: width + WALL, y: 55 },
    { x: width + WALL, y: height + WALL },
    { x: bottomEntranceEnd + 6, y: height + WALL },
    { x: bottomEntranceEnd + 6, y: height - NOTCH_DEPTH },
    { x: bottomEntranceStart - 6, y: height - NOTCH_DEPTH },
    { x: bottomEntranceStart - 6, y: height + WALL },
    { x: -WALL, y: height + WALL },
  ];

  // Shift everything from the internal 0-based coordinate system into the
  // padded canvas so the outline (which extends above/beside the shop grid)
  // never gets clipped by the SVG viewBox.
  const shiftPoint = (p: Point): Point => ({ x: p.x + PAD_SIDE, y: p.y + PAD_TOP });
  const shiftPoints = (pts: Point[]): Point[] => pts.map(shiftPoint);

  return {
    shops: shops.map((s) => ({
      ...s,
      polygonPoints: shiftPoints(s.polygonPoints),
      centerPoint: shiftPoint(s.centerPoint),
      labelPosition: shiftPoint(s.labelPosition),
    })),
    decorativeZones: [administrationZone, bottomEntranceZone, ...topEntranceZones, ...corridorZones].map(
      (z) => ({
        ...z,
        polygonPoints: shiftPoints(z.polygonPoints),
        labelPosition: shiftPoint(z.labelPosition),
      })
    ),
    buildingOutline: shiftPoints(buildingOutlineRaw),
  };
}
