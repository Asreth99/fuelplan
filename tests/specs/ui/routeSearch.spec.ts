import { test, expect } from "../../fixtures";
import { BUDAPEST_TO_DEBRECEN, BUDAPEST_TO_NEW_YORK } from "../../data/trips";

test.describe("Route search on desktop", () => {
  test.beforeEach(async ({ app }) => {
    await test.step("Open FuelPlan; the route card is visible next to the map", async () => {
      await app.open();
    });
  });

  test("@maps picking both places finds the route and fills the distance", async ({ routeSearch, trip, mapView }) => {
    const route = BUDAPEST_TO_DEBRECEN;

    await test.step(`Pick ${route.from} as the start and ${route.to} as the destination from the suggestions`, async () => {
      await routeSearch.searchRoute(route);
    });

    await test.step("Expect the route summary to show its length in km, without pressing Search", async () => {
      await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
    });

    await test.step("Expect no info bubble on the map; the summary in the panel is enough", async () => {
      await expect(mapView.infoCards).toHaveCount(0);
    });

    await test.step("Expect the trip distance to be filled in from the route", async () => {
      await expect(trip.distance).not.toHaveValue("");
    });
  });

  test("@maps tells the user inline when no route exists", async ({ routeSearch }) => {
    const route = BUDAPEST_TO_NEW_YORK;

    await test.step(`Pick ${route.from} as the start and ${route.to} as the destination`, async () => {
      await routeSearch.searchRoute(route);
    });

    await test.step("Expect a 'No route found' message inside the route card, instead of a pop-up", async () => {
      await expect(routeSearch.routeError).toBeVisible({ timeout: 15_000 });
    });
  });
});
