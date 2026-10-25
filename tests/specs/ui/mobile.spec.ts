import { test, expect } from "../../fixtures";
import { OVER_PULL_PX, PHONE, SHEET_MAX_SCREEN_SHARE } from "../../data/devices";
import { BUDAPEST_TO_DEBRECEN, SHORT_TRIP } from "../../data/trips";

test.describe("Trip cost on mobile", () => {
  test.use(PHONE);

  test.beforeEach(async ({ app }) => {
    await test.step("Open FuelPlan on a phone-sized screen", async () => {
      await app.open();
    });
  });

  test("the cost stays in view while filling in the trip in the bottom sheet", async ({ app, trip }) => {
    await test.step("Expect the small sheet's cost card to ask for the distance and consumption", async () => {
      await expect(trip.costHint).toBeInViewport();
    });

    await test.step("Drag the bottom sheet up to reach the trip inputs", async () => {
      await app.expandBottomSheet();
    });

    await test.step(
      `Fill in a ${SHORT_TRIP.distanceKm} km trip at ${SHORT_TRIP.consumption} L/100km for ${SHORT_TRIP.passengers} passengers, scrolling down the sheet to the passenger buttons`,
      async () => {
        await trip.fillTrip(SHORT_TRIP);
      }
    );

    await test.step("Expect the fuel cost to be visible on screen, pinned above the scrolled inputs", async () => {
      await expect(trip.totalCost).toBeInViewport();
    });
  });

  test("@maps the route's duration and length stay in view while scrolling the sheet", async ({ app, routeSearch, trip }) => {
    await test.step(`Pick ${BUDAPEST_TO_DEBRECEN.from} and ${BUDAPEST_TO_DEBRECEN.to} in the route card at the top`, async () => {
      await routeSearch.searchRoute(BUDAPEST_TO_DEBRECEN);
    });

    await test.step("Expect the duration and length at the top of the bottom sheet", async () => {
      await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
    });

    await test.step("Drag the sheet up and fill in the trip, which scrolls it down to the passenger buttons", async () => {
      await app.expandBottomSheet();
      await trip.fillTrip(SHORT_TRIP);
    });

    await test.step("Expect the duration and length to still be on screen", async () => {
      await expect(routeSearch.routeSummary).toBeInViewport();
    });
  });

  test("pulling the sheet down too far slides it behind the tab bar, not over it", async ({ app, menu }) => {
    await test.step(`Pull the bottom sheet ${OVER_PULL_PX}px below its smallest size and keep holding it`, async () => {
      await app.holdBottomSheetPulledDown(OVER_PULL_PX);
    });

    await test.step("Expect the tab bar's Plan, Cars and Profile to stay on top of the sheet", async () => {
      expect(await menu.isOnTop(menu.planItem)).toBe(true);
      expect(await menu.isOnTop(menu.carsItem)).toBe(true);
      expect(await menu.isOnTop(menu.profileItem)).toBe(true);
    });

    await test.step("Let go", async () => {
      await app.releaseDrag();
    });
  });

  test("most of the screen is left for the map", async ({ mapView }) => {
    const minimum = Math.round(PHONE.viewport.height * 0.4);

    await test.step(`Expect at least ${minimum}px (40% of the screen) of map between the route card and the bottom sheet`, async () => {
      await expect.poll(() => mapView.visibleMapHeight()).toBeGreaterThanOrEqual(minimum);
    });
  });

  test("the small sheet always fits the whole cost card, before and after there is a cost", async ({ app, menu, trip }) => {
    await test.step("Expect the sheet to open small, below the middle of the screen", async () => {
      await expect.poll(() => app.bottomSheetTop()).toBeGreaterThan(PHONE.viewport.height / 2);
    });

    await test.step("Expect the whole cost card (asking for the trip details) to be visible, none of it behind the tab bar", async () => {
      await expect(trip.costHint).toBeVisible();
      await expect.poll(() => menu.pxCovered(trip.costCard)).toBe(0);
    });

    await test.step(`Drag the sheet up, fill in a ${SHORT_TRIP.distanceKm} km trip for ${SHORT_TRIP.passengers} passengers, and drag it back down`, async () => {
      await app.expandBottomSheet();
      await trip.fillTrip(SHORT_TRIP);
      await app.collapseBottomSheet();
    });

    await test.step("Expect the taller card with the cost and the per-person cost to be fully visible too", async () => {
      await expect(trip.costPerPerson).toBeVisible();
      await expect.poll(() => menu.pxCovered(trip.costCard)).toBe(0);
    });

    await test.step("Expect the sheet to still be small: the map keeps most of the screen", async () => {
      expect(await app.bottomSheetTop()).toBeGreaterThan(PHONE.viewport.height / 2);
    });
  });

  test("the bottom sheet can be dragged up to three quarters of the screen, no further", async ({ app }) => {
    const highestTop = PHONE.viewport.height * (1 - SHEET_MAX_SCREEN_SHARE);

    await test.step("Drag the bottom sheet's handle to the top of the screen", async () => {
      await app.expandBottomSheet();
    });

    await test.step(`Expect it to stop at ${SHEET_MAX_SCREEN_SHARE * 100}% of the screen (top edge at ${highestTop}px), below the route card's area`, async () => {
      expect(await app.bottomSheetTop()).toBeCloseTo(highestTop, -1);
    });
  });
});
