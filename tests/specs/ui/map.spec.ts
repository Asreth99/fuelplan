import { test, expect } from "../../fixtures";
import { CHAIN_BRIDGE_ICON } from "../../data/locations";

test.describe("Map controls on desktop", () => {
  test.beforeEach(async ({ app, mapView }) => {
    await test.step("Open FuelPlan and wait for the map controls to appear", async () => {
      await app.open();
      await expect(mapView.locateButton).toBeVisible();
    });
  });

  test("@maps there is no Map/Satellite switcher hidden under the panel", async ({ mapView }) => {
    await test.step("Expect Google's Map/Satellite switcher not to be on the map", async () => {
      await expect(mapView.mapTypeSwitcher).toHaveCount(0);
    });
  });

  test("@maps tapping a place icon on the map opens no card and causes no error", async ({ mapView, pageErrors }) => {
    await test.step(`Tap the ${CHAIN_BRIDGE_ICON.name} icon on the map`, async () => {
      await mapView.tapMap(CHAIN_BRIDGE_ICON.offsetFromMapCentre);
    });

    await test.step("Expect no place card to open (it used to get stuck on the map, without a close button)", async () => {
      await expect(mapView.infoCards).toHaveCount(0);
    });

    await test.step("Expect no error on the page", async () => {
      expect(pageErrors).toEqual([]);
    });
  });
});
