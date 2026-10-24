import { useEffect } from "react";

// The Google Maps app's one-finger zoom, which the JavaScript map lacks:
// double-tap, keep the finger down, then slide down to zoom in or up to zoom out.
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE_PX = 40;
const TAP_MAX_MS = 250;
const TAP_MAX_MOVE_PX = 10;
const SLIDE_START_PX = 8;
const PX_PER_ZOOM_LEVEL = 120;
const MIN_ZOOM = 3;
const MAX_ZOOM = 21;

type Gesture = {
  pointerId: number;
  startY: number;
  startZoom: number;
  // The tapped spot, in world coordinates and as an offset (px) from the map's centre.
  anchorWorld: google.maps.Point;
  offsetX: number;
  offsetY: number;
  sliding: boolean;
};

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export default function useOneFingerZoom(map: google.maps.Map | null) {
  useEffect(() => {
    if (!map) return;
    const div = map.getDiv();
    const touchPointers = new Set<number>();
    let lastTap: { time: number; x: number; y: number } | null = null;
    let press: { time: number; x: number; y: number } | null = null;
    let gesture: Gesture | null = null;

    // Zooms while keeping the tapped spot under the finger.
    const zoomAroundTap = (zoom: number) => {
      const projection = map.getProjection();
      if (!projection || !gesture) return;
      const scale = 2 ** zoom;
      const center = projection.fromPointToLatLng(
        new google.maps.Point(
          gesture.anchorWorld.x - gesture.offsetX / scale,
          gesture.anchorWorld.y - gesture.offsetY / scale
        )
      );
      if (center) map.moveCamera({ center, zoom });
    };

    const startGesture = (e: PointerEvent) => {
      const projection = map.getProjection();
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (!projection || !center || zoom === undefined) return null;
      const rect = div.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      const centerWorld = projection.fromLatLngToPoint(center)!;
      const scale = 2 ** zoom;
      return {
        pointerId: e.pointerId,
        startY: e.clientY,
        startZoom: zoom,
        anchorWorld: new google.maps.Point(centerWorld.x + offsetX / scale, centerWorld.y + offsetY / scale),
        offsetX,
        offsetY,
        sliding: false,
      };
    };

    // Pointer events arrive before touch events, so the second tap is recognised here,
    // before Google's own handlers start a pan.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touchPointers.add(e.pointerId);
      if (touchPointers.size > 1) {
        // A second finger: this is a pinch, leave it to Google.
        gesture = null;
        lastTap = null;
        return;
      }
      const now = performance.now();
      press = { time: now, x: e.clientX, y: e.clientY };
      const isSecondTap =
        lastTap !== null &&
        now - lastTap.time < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < DOUBLE_TAP_DISTANCE_PX;
      if (!isSecondTap) return;
      gesture = startGesture(e);
      lastTap = null;
      if (gesture) e.stopPropagation();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!gesture || e.pointerId !== gesture.pointerId) return;
      e.stopPropagation();
      const slide = e.clientY - gesture.startY;
      if (Math.abs(slide) > SLIDE_START_PX) gesture.sliding = true;
      if (gesture.sliding) zoomAroundTap(clampZoom(gesture.startZoom + slide / PX_PER_ZOOM_LEVEL));
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touchPointers.delete(e.pointerId);
      if (gesture && e.pointerId === gesture.pointerId) {
        e.stopPropagation();
        // A plain double-tap (no slide) still zooms in one level.
        if (!gesture.sliding && e.type === "pointerup") zoomAroundTap(clampZoom(gesture.startZoom + 1));
        gesture = null;
        return;
      }
      const wasQuickTap =
        press !== null &&
        e.type === "pointerup" &&
        performance.now() - press.time < TAP_MAX_MS &&
        Math.hypot(e.clientX - press.x, e.clientY - press.y) < TAP_MAX_MOVE_PX;
      lastTap = wasQuickTap ? { time: performance.now(), x: e.clientX, y: e.clientY } : null;
      press = null;
    };

    // While the gesture runs, touch events must not reach Google either,
    // and the browser must not treat the double-tap as its own zoom.
    const onTouch = (e: TouchEvent) => {
      if (!gesture) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const capture = { capture: true, passive: false };
    const listeners: [string, EventListener][] = [
      ["pointerdown", onPointerDown as EventListener],
      ["pointermove", onPointerMove as EventListener],
      ["pointerup", onPointerEnd as EventListener],
      ["pointercancel", onPointerEnd as EventListener],
      ["touchstart", onTouch as EventListener],
      ["touchmove", onTouch as EventListener],
      ["touchend", onTouch as EventListener],
    ];
    listeners.forEach(([type, listener]) => div.addEventListener(type, listener, capture));
    return () => listeners.forEach(([type, listener]) => div.removeEventListener(type, listener, capture));
  }, [map]);
}
