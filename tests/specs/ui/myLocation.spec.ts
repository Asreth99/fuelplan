import { test, expect } from "../../fixtures";
import { DEBRECEN_CENTRE, LOCATED_ZOOM } from "../../data/locations";
import { BUDAPEST_TO_SZEGED } from "../../data/trips";
import { PHONE } from "../../data/devices";

const location = DEBRECEN_CENTRE;

test.describe("Find my location", () => {
  test.describe("when the browser shares the location", () => {
    test.use({
      geolocation: { latitude: location.latitude, longitude: location.longitude },
      permissions: ["geolocation"],
    });

    test.beforeEach(async ({ app }) => {
      await test.step(`Open FuelPlan with the browser reporting the user at ${location.name}`, async () => {
        await app.open();
      });
    });

    test("@maps jumps to the user's location, marks it and uses it as the start", async ({ mapView, routeSearch }) => {
      await test.step("Expect no location marker before the button is pressed", async () => {
        await expect(mapView.myLocationMarker).toHaveCount(0);
      });

      await test.step("Click the 'Find my location' button on the map", async () => {
        await mapView.locateButton.click();
      });

      await test.step(`Expect the map to jump to ${location.name} and show the 'Your location' marker in view`, async () => {
        await expect(mapView.myLocationMarker).toBeInViewport();
      });

      await test.step("Expect the route's Start field to say 'Your location'", async () => {
        await expect(routeSearch.start).toHaveValue("Your location");
      });
    });

    test("@maps with a destination already chosen, finds the route from the user's location", async ({ mapView, routeSearch }) => {
      await test.step("Pick Budapest as the destination, leaving the start empty", async () => {
        await routeSearch.pickPlace(routeSearch.destination, "Budapest");
      });

      await test.step("Click the 'Find my location' button on the map", async () => {
        await mapView.locateButton.click();
      });

      await test.step(`Expect a route from ${location.city} to Budapest to appear, without any other click`, async () => {
        await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
      });
    });

    test("@maps with a route already on the map, still jumps to the user instead of back to the route", async ({ mapView, routeSearch }) => {
      const route = BUDAPEST_TO_SZEGED;

      await test.step(`Plan a route from ${route.from} to ${route.to}, far from the user`, async () => {
        await routeSearch.searchRoute(route);
        await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
      });

      await test.step("Click the 'Find my location' button on the map", async () => {
        await mapView.locateButton.click();
      });

      await test.step(`Expect the map to settle at street level (zoom ${LOCATED_ZOOM}) on the 'Your location' marker, not zoom back out to the route`, async () => {
        await expect(mapView.myLocationMarker).toBeInViewport();
        // Give a late re-fit to the re-planned route the chance to happen before checking.
        await expect.poll(() => mapView.zoomLevel(), { intervals: [1_000, 1_000, 1_000] }).toBe(LOCATED_ZOOM);
        await expect(mapView.myLocationMarker).toBeInViewport();
      });

      await test.step("Expect the route to be re-planned from 'Your location'", async () => {
        await expect(routeSearch.start).toHaveValue("Your location");
      });
    });
  });

  test.describe("when the browser blocks location access", () => {
    test.use({ permissions: [] });

    test("@maps shows a 'Location unavailable' alert", async ({ app, mapView }) => {
      await test.step("Open FuelPlan without granting location permission", async () => {
        await app.open();
      });

      await test.step("Click the 'Find my location' button on the map", async () => {
        await mapView.locateButton.click();
      });

      await test.step("Expect the red 'Location unavailable' alert and no location marker", async () => {
        await expect(mapView.locationAlert).toBeVisible();
        await expect(mapView.myLocationMarker).toHaveCount(0);
      });
    });
  });

  test.describe("on mobile", () => {
    test.use(PHONE);

    test("@maps the button rides on the bottom sheet up to half the screen, then stays behind it", async ({ app, mapView }) => {
      let startTop = 0;

      await test.step("Open FuelPlan on a phone-sized screen", async () => {
        await app.open();
      });

      await test.step("Expect the 'Find my location' button below the route card, right above the sheet", async () => {
        await expect(async () => {
          const placement = await mapView.locateButtonPlacement();
          expect(placement.gapBelowRouteCard, "button is not covered by the route card").toBeGreaterThanOrEqual(0);
          expect(placement.gapAboveSheet, "button is not covered by the sheet").toBeGreaterThanOrEqual(0);
          expect(placement.gapAboveSheet, "button sits right above the sheet").toBeLessThanOrEqual(20);
          startTop = placement.top;
        }).toPass();
      });

      await test.step("Drag the bottom sheet all the way up", async () => {
        await app.expandBottomSheet();
      });

      await test.step("Expect the button to have stopped at the middle of the screen, with the sheet now covering it", async () => {
        const half = PHONE.viewport.height / 2;
        const placement = await mapView.locateButtonPlacement();
        expect(placement.top, "button moved up with the sheet").toBeLessThan(startTop);
        expect(placement.bottom, "button stopped just above the middle").toBeGreaterThan(half - 20);
        expect(placement.bottom, "button stopped just above the middle").toBeLessThanOrEqual(half);
        expect(placement.gapAboveSheet, "the sheet has slid over the button").toBeLessThan(0);
      });

      await test.step("Drag the bottom sheet back down to its smallest height", async () => {
        await app.collapseBottomSheet();
      });

      await test.step("Expect the button to come back down with the sheet and sit right above it again", async () => {
        await expect(async () => {
          const placement = await mapView.locateButtonPlacement();
          expect(placement.top, "button is back where it started").toBeCloseTo(startTop, -1);
          expect(placement.gapAboveSheet, "button is not covered by the sheet").toBeGreaterThanOrEqual(0);
          expect(placement.gapAboveSheet, "button sits right above the sheet").toBeLessThanOrEqual(20);
        }).toPass();
      });
    });
  });
});
