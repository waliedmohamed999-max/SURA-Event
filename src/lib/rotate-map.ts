import type { DecorativeZoneDTO, ShopDTO } from "./types";

export interface Point {
  x: number;
  y: number;
}

/**
 * Rotates a portrait pavilion layout 90° counter-clockwise into a landscape
 * one for wide desktop screens — the map's natural shape (tall and narrow,
 * matching the real building) wastes most of a landscape viewport, so on
 * desktop we display it turned on its side instead. Mobile keeps the
 * untouched portrait data (matches the building's real proportions).
 *
 * This transforms the coordinate *data*, not a CSS transform on the SVG —
 * that keeps pointer/click math in the pan-zoom hook simple, since the
 * rendered SVG is never itself CSS-rotated.
 */
function rotatePoint(p: Point, sourceWidth: number): Point {
  return { x: p.y, y: sourceWidth - p.x };
}

function rotatePoints(points: Point[], sourceWidth: number): Point[] {
  return points.map((p) => rotatePoint(p, sourceWidth));
}

export function rotateViewBox(viewBox: { width: number; height: number }) {
  return { width: viewBox.height, height: viewBox.width };
}

export function rotateShops(shops: ShopDTO[], sourceWidth: number): ShopDTO[] {
  return shops.map((shop) =>
    shop.geometry
      ? {
          ...shop,
          geometry: {
            ...shop.geometry,
            polygonPoints: rotatePoints(shop.geometry.polygonPoints, sourceWidth),
            centerPoint: rotatePoint(shop.geometry.centerPoint, sourceWidth),
            labelPosition: rotatePoint(shop.geometry.labelPosition, sourceWidth),
          },
        }
      : shop
  );
}

export function rotateDecorativeZones(
  zones: DecorativeZoneDTO[],
  sourceWidth: number
): DecorativeZoneDTO[] {
  return zones.map((zone) => ({
    ...zone,
    polygonPoints: rotatePoints(zone.polygonPoints, sourceWidth),
    labelPosition: rotatePoint(zone.labelPosition, sourceWidth),
  }));
}

export function rotateOutline(outline: Point[], sourceWidth: number): Point[] {
  return rotatePoints(outline, sourceWidth);
}
