import { test, expect } from "../../fixtures";
import { BUDAPEST_TO_DEBRECEN, DETOUR_STOP } from "../../data/trips";

const route = BUDAPEST_TO_DEBRECEN;

test.describe("Stops on desktop", () => {
  let directKm = 0;

  test.beforeEach(async ({ app, routeSearch, trip }) => {
    await test.step(`Open FuelPlan and plan a route from ${route.from} to ${route.to}`, async () => {
      await app.open();
      await routeSearch.searchRoute(route);
      await expect(routeSearch.routeSummary).toContainText("km", { timeout: 15_000 });
    });

    directKm = await test.step("Note the trip distance of the direct route", async () => {
      await expect(trip.distance).not.toHaveValue("");
      return Number(await trip.distance.inputValue());
    });
  });

  test("@maps start and destination alone have markers but no remove buttons", async ({ routeSearch }) => {
    await test.step("Expect a marker on the map for the start (A) and the destination (B)", async () => {
      await expect(routeSearch.routeMarkers).toHaveCount(2);
    });

    await test.step("Expect no ✕ buttons, because a route needs at least a start and a destination", async () => {
      await expect(routeSearch.removeButtons).toHaveCount(0);
    });
  });

  test("@maps adding a stop re-plans the route through it and lengthens the trip", async ({ routeSearch, trip }) => {
    await test.step(`Press 'Add stop' and pick ${DETOUR_STOP}`, async () => {
      await routeSearch.addStop(DETOUR_STOP);
    });

    await test.step(`Expect the route to go through ${DETOUR_STOP}: a marker for each of the three places`, async () => {
      await expect(routeSearch.routeMarkers).toHaveCount(3, { timeout: 15_000 });
      await expect(routeSearch.routeMarker("B")).toHaveAttribute("title", new RegExp(DETOUR_STOP));
    });

    await test.step(`Expect the trip distance to grow beyond the direct ${directKm} km, adding up all sections`, async () => {
      await expect.poll(async () => Number(await trip.distance.inputValue())).toBeGreaterThan(directKm + 50);
    });
  });

  test("@maps removing the stop re-plans the route without it", async ({ routeSearch, trip }) => {
    await test.step(`Add ${DETOUR_STOP} as a stop and wait for the longer route`, async () => {
      await routeSearch.addStop(DETOUR_STOP);
      await expect(routeSearch.routeMarkers).toHaveCount(3, { timeout: 15_000 });
    });

    await test.step("Press the ✕ next to the stop", async () => {
      await routeSearch.removeStop("Stop 1");
    });

    await test.step(`Expect the direct route back: two markers and ${directKm} km again`, async () => {
      await expect(routeSearch.routeMarkers).toHaveCount(2, { timeout: 15_000 });
      await expect.poll(async () => Number(await trip.distance.inputValue())).toBe(directKm);
    });
  });

  test("@maps dragging a place into a new position re-plans the route in that order", async ({ routeSearch, trip }) => {
    const viaStopKm = await test.step(`Add ${DETOUR_STOP} as a stop (${route.from} → ${DETOUR_STOP} → ${route.to}) and note the distance`, async () => {
      await routeSearch.addStop(DETOUR_STOP);
      await expect(routeSearch.routeMarkers).toHaveCount(3, { timeout: 15_000 });
      await expect.poll(async () => Number(await trip.distance.inputValue())).toBeGreaterThan(directKm + 50);
      return Number(await trip.distance.inputValue());
    });

    await test.step(`Drag ${route.to} by its handle up onto the stop's position`, async () => {
      await routeSearch.moveStop("Destination", "Stop 1");
    });

    await test.step(`Expect the new order ${route.from} → ${route.to} → ${DETOUR_STOP} in the fields`, async () => {
      await expect(routeSearch.field("Stop 1")).toHaveValue(new RegExp(route.to));
      await expect(routeSearch.destination).toHaveValue(new RegExp(DETOUR_STOP));
    });

    await test.step(`Expect the map's B marker on ${route.to} and a different trip distance than ${viaStopKm} km`, async () => {
      await expect(routeSearch.routeMarker("B")).toHaveAttribute("title", new RegExp(route.to), { timeout: 15_000 });
      await expect.poll(async () => Number(await trip.distance.inputValue())).not.toBe(viaStopKm);
    });
  });

  test("@maps an added but still empty stop leaves the current route alone", async ({ routeSearch, trip }) => {
    await test.step("Press 'Add stop' and leave the new field empty", async () => {
      await routeSearch.addStopButton.click();
    });

    await test.step("Expect the empty stop field to be ready for typing", async () => {
      await expect(routeSearch.field("Stop 1")).toBeFocused();
    });

    await test.step(`Expect the direct route to stay: no error, two markers, ${directKm} km`, async () => {
      await expect(routeSearch.routeError).toHaveCount(0);
      await expect(routeSearch.routeMarkers).toHaveCount(2);
      await expect(trip.distance).toHaveValue(String(directKm));
    });
  });
});
