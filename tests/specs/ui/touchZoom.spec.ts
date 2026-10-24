import { test, expect } from "../../fixtures";
import { PHONE } from "../../data/devices";

// The map opens at zoom 15; one zoom level per 120 px of slide.
const START_ZOOM = 15;
const SLIDE_PX = 240;

test.describe("One-finger zoom on mobile", () => {
  test.use(PHONE);

  test.beforeEach(async ({ app, mapView }) => {
    await test.step(`Open FuelPlan on a phone-sized screen; the map starts at zoom ${START_ZOOM}`, async () => {
      await app.open();
      await expect.poll(() => mapView.zoomLevel()).toBe(START_ZOOM);
    });
  });

  test("@maps double-tap, hold and slide down zooms in", async ({ mapView }) => {
    await test.step(`Double-tap the map, keep the finger down and slide it ${SLIDE_PX}px down`, async () => {
      await mapView.doubleTapAndSlide(SLIDE_PX);
    });

    await test.step("Expect the map to have zoomed in by about two levels", async () => {
      await expect.poll(() => mapView.zoomLevel()).toBeGreaterThan(START_ZOOM + 1.5);
    });
  });

  test("@maps double-tap, hold and slide up zooms out", async ({ mapView }) => {
    await test.step(`Double-tap the map, keep the finger down and slide it ${SLIDE_PX}px up`, async () => {
      await mapView.doubleTapAndSlide(-SLIDE_PX);
    });

    await test.step("Expect the map to have zoomed out by about two levels", async () => {
      await expect.poll(() => mapView.zoomLevel()).toBeLessThan(START_ZOOM - 1.5);
    });
  });

  test("@maps a plain double-tap still zooms in one level", async ({ mapView }) => {
    await test.step("Double-tap the map without sliding", async () => {
      await mapView.doubleTapAndSlide(0);
    });

    await test.step(`Expect the map at zoom ${START_ZOOM + 1}`, async () => {
      await expect.poll(() => mapView.zoomLevel()).toBe(START_ZOOM + 1);
    });
  });

  test("@maps dragging with one finger still moves the map without zooming", async ({ mapView }) => {
    await test.step("Drag the map 150px sideways with one finger", async () => {
      await mapView.dragWithOneFinger(150);
    });

    await test.step(`Expect the zoom to stay at ${START_ZOOM}`, async () => {
      await expect.poll(() => mapView.zoomLevel()).toBe(START_ZOOM);
    });
  });
});
