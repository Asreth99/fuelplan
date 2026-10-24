import { test, expect } from "../../fixtures";
import { BUDAPEST_TO_DEBRECEN, DETOUR_STOP } from "../../data/trips";

const route = BUDAPEST_TO_DEBRECEN;

test.describe("Route options on desktop", () => {
  test.beforeEach(async ({ app, routeSearch }) => {
    await test.step(`Open FuelPlan and plan a route from ${route.from} to ${route.to}`, async () => {
      await app.open();
      await routeSearch.searchRoute(route);
      await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
    });
  });

  test("@maps choosing another route option fills in its distance", async ({ trip, routeSearch }) => {
    await test.step("Expect Google to offer more than one route, with its recommendation chosen", async () => {
      // Google decides how many options there are; Budapest–Debrecen has had several for years.
      await expect.poll(() => trip.routeOptions.count()).toBeGreaterThan(1);
      await expect(trip.routeOptions.first()).toHaveAttribute("aria-pressed", "true");
    });

    const firstKm = await test.step("Read the length of the chosen (first) option", () =>
      trip.routeOptionKm(trip.routeOptions.first())
    );

    await test.step(`Expect the trip distance to be that option's ${firstKm} km`, async () => {
      await expect(trip.distance).toHaveValue(String(firstKm));
    });

    const secondKm = await test.step("Read the length of the second option", () =>
      trip.routeOptionKm(trip.routeOptions.nth(1))
    );

    await test.step("Choose the second option", async () => {
      await trip.routeOptions.nth(1).click();
    });

    await test.step(`Expect it to be the chosen one, with the distance and the summary at its ${secondKm} km`, async () => {
      await expect(trip.routeOptions.nth(1)).toHaveAttribute("aria-pressed", "true");
      await expect(trip.routeOptions.first()).toHaveAttribute("aria-pressed", "false");
      await expect(trip.distance).toHaveValue(String(secondKm));
      await expect(routeSearch.routeSummary).toContainText(`${secondKm} km`);
    });
  });

  test("@maps a route with a stop has no route options", async ({ trip, routeSearch }) => {
    await test.step(`Add ${DETOUR_STOP} as a stop and wait for the new route`, async () => {
      await routeSearch.addStop(DETOUR_STOP);
      await expect(routeSearch.routeMarkers).toHaveCount(3, { timeout: 15_000 });
    });

    await test.step("Expect no route options: Google offers alternatives only without stops", async () => {
      await expect(trip.routeOptions).toHaveCount(0);
    });
  });
});
