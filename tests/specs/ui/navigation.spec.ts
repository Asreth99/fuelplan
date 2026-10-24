import { test, expect } from "../../fixtures";
import { PHONE } from "../../data/devices";
import { SHORT_TRIP } from "../../data/trips";

const LAYOUTS = [
  { name: "desktop", device: {}, menu: "left rail" },
  { name: "phone", device: PHONE, menu: "bottom tab bar" },
];

for (const layout of LAYOUTS) {
  test.describe(`Main menu on ${layout.name}`, () => {
    test.use(layout.device);

    test.beforeEach(async ({ app }) => {
      await test.step("Open FuelPlan", async () => {
        await app.open();
      });
    });

    test(`the ${layout.menu} lists Plan, Cars and Profile, with Plan active`, async ({ menu }) => {
      await test.step("Expect exactly three items, in the order Plan, Cars, Profile", async () => {
        await expect(menu.items).toHaveText(["Plan", "Cars", "Profile"]);
      });

      await test.step("Expect Plan to be marked as the current screen", async () => {
        await expect(menu.planItem).toHaveAttribute("aria-current", "page");
      });
    });

    test("switching screens keeps the trip that was being planned", async ({ app, menu, trip }) => {
      await test.step(`Enter a ${SHORT_TRIP.distanceKm} km trip at ${SHORT_TRIP.consumption} L/100km (on phones, after dragging the sheet up)`, async () => {
        await app.revealTripInputs();
        await trip.fillTrip(SHORT_TRIP);
      });

      await test.step("Open Cars, then Profile", async () => {
        await menu.openCars();
        await menu.openProfile();
      });

      await test.step("Expect the trip to be out of sight while on Profile", async () => {
        await expect(trip.distance).toBeHidden();
        await expect(menu.profileItem).toHaveAttribute("aria-current", "page");
      });

      await test.step("Go back to Plan", async () => {
        await menu.openPlan();
      });

      await test.step(`Expect the trip to still read ${SHORT_TRIP.distanceKm} km`, async () => {
        await expect(trip.distance).toHaveValue(String(SHORT_TRIP.distanceKm));
        await expect(menu.carsScreen).toBeHidden();
      });
    });
  });
}
