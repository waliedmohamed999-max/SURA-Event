"use client";

import { useCallback, useRef, useState } from "react";

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 6;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Pan/zoom for an SVG map: wheel zoom, drag pan (mouse + single touch via
 * Pointer Events), pinch-zoom (two touch pointers), plus imperative
 * zoomIn/zoomOut/reset/focusOn helpers for the toolbar and click-to-zoom.
 */
export function usePanZoom(viewBox: { width: number; height: number }) {
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragState = useRef<{ startX: number; startY: number; origin: Transform } | null>(null);
  const pinchState = useRef<{ startDist: number; origin: Transform; center: { x: number; y: number } } | null>(
    null
  );

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * viewBox.width;
    const py = ((clientY - rect.top) / rect.height) * viewBox.height;
    return { x: px, y: py };
  }, [viewBox.width, viewBox.height]);

  const zoomAt = useCallback((focal: { x: number; y: number }, nextScale: number) => {
    setTransform((prev) => {
      const scale = clampScale(nextScale);
      // Keep the focal point (in un-transformed viewBox space) visually fixed.
      const worldX = (focal.x - prev.x) / prev.scale;
      const worldY = (focal.y - prev.y) / prev.scale;
      const x = focal.x - worldX * scale;
      const y = focal.y - worldY * scale;
      return { scale, x, y };
    });
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const focal = toSvgPoint(e.clientX, e.clientY);
      const delta = -e.deltaY * 0.0015;
      setTransform((prev) => {
        const nextScale = clampScale(prev.scale * (1 + delta));
        const worldX = (focal.x - prev.x) / prev.scale;
        const worldY = (focal.y - prev.y) / prev.scale;
        return { scale: nextScale, x: focal.x - worldX * nextScale, y: focal.y - worldY * nextScale };
      });
    },
    [toSvgPoint]
  );

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragState.current = { startX: e.clientX, startY: e.clientY, origin: transform };
    } else if (pointers.current.size === 2) {
      dragState.current = null;
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const centerClient = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      pinchState.current = {
        startDist: dist,
        origin: transform,
        center: toSvgPoint(centerClient.x, centerClient.y),
      };
    }
  }, [transform, toSvgPoint]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2 && pinchState.current) {
        const pts = Array.from(pointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = dist / pinchState.current.startDist;
        const nextScale = clampScale(pinchState.current.origin.scale * ratio);
        const { center, origin } = pinchState.current;
        const worldX = (center.x - origin.x) / origin.scale;
        const worldY = (center.y - origin.y) / origin.scale;
        setTransform({ scale: nextScale, x: center.x - worldX * nextScale, y: center.y - worldY * nextScale });
        return;
      }

      if (pointers.current.size === 1 && dragState.current) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleFactor = viewBox.width / rect.width;
        const dx = (e.clientX - dragState.current.startX) * scaleFactor;
        const dy = (e.clientY - dragState.current.startY) * scaleFactor;
        setTransform({ ...dragState.current.origin, x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy });
      }
    },
    [viewBox.width]
  );

  const endPointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      dragState.current = null;
      pinchState.current = null;
    } else if (pointers.current.size === 1) {
      pinchState.current = null;
      const [remaining] = Array.from(pointers.current.values());
      dragState.current = { startX: remaining.x, startY: remaining.y, origin: transform };
    }
  }, [transform]);

  const zoomIn = useCallback(() => {
    zoomAt({ x: viewBox.width / 2, y: viewBox.height / 2 }, transform.scale * 1.3);
  }, [zoomAt, transform.scale, viewBox.width, viewBox.height]);

  const zoomOut = useCallback(() => {
    zoomAt({ x: viewBox.width / 2, y: viewBox.height / 2 }, transform.scale / 1.3);
  }, [zoomAt, transform.scale, viewBox.width, viewBox.height]);

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  /** Animate (via CSS transition class on the caller) to center a world-space point at a given scale. */
  const focusOn = useCallback(
    (point: { x: number; y: number }, targetScale = 2.2) => {
      const scale = clampScale(targetScale);
      setTransform({
        scale,
        x: viewBox.width / 2 - point.x * scale,
        y: viewBox.height / 2 - point.y * scale,
      });
    },
    [viewBox.width, viewBox.height]
  );

  return {
    svgRef,
    transform,
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
    },
    zoomIn,
    zoomOut,
    reset,
    focusOn,
  };
}
