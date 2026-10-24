import { test, expect } from "../../fixtures";
import { GOOGLE_ACCOUNT } from "../../data/accounts";
import { FABIA, GOLF } from "../../data/cars";

test.describe("Cars on several devices", () => {
  test.beforeEach(async ({ app, emulator, menu, signIn, otherDevice }) => {
    await test.step("Start with no test accounts and no saved cars in the local Firebase emulator", async () => {
      await emulator.reset();
    });

    await test.step(`On this device, open Cars and sign in with Google as ${GOOGLE_ACCOUNT.email}`, async () => {
      await app.open();
      await menu.openCars();
      await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
    });

    await test.step("On another device, sign in to the same account and open Cars", async () => {
      await otherDevice.app.open();
      await otherDevice.menu.openCars();
      await otherDevice.signIn.signInWithGoogle(GOOGLE_ACCOUNT);
      await expect(otherDevice.cars.emptyState).toBeVisible();
    });
  });

  test("a car saved on one device appears on the other without reloading", async ({ cars, otherDevice }) => {
    await test.step(`Save ${GOLF.name} on this device`, async () => {
      await cars.addCar(GOLF);
    });

    await test.step(`Expect ${GOLF.name} to appear on the other device by itself`, async () => {
      await expect(otherDevice.cars.tile(GOLF.name)).toContainText(GOLF.details);
    });
  });

  test("a car saved while offline syncs once the connection is back", async ({ app, cars, menu, profile, otherDevice }) => {
    await test.step("Lose the internet connection on this device", async () => {
      await app.setOffline(true);
    });

    await test.step("Expect Profile to say changes are saved when back online", async () => {
      await menu.openProfile();
      await expect(profile.syncStatus).toHaveText("You're offline. Changes are saved as soon as you're back online.");
    });

    await test.step(`Save ${FABIA.name} while offline: it shows up in the list at once`, async () => {
      await menu.openCars();
      await cars.addCar(FABIA);
    });

    await test.step("Expect the other device not to have it yet", async () => {
      await expect(otherDevice.cars.emptyState).toBeVisible();
    });

    await test.step("Get the connection back", async () => {
      await app.setOffline(false);
    });

    await test.step(`Expect ${FABIA.name} to reach the other device`, async () => {
      // Firestore retries with a back-off after a connection loss, so this can take a few seconds.
      await expect(otherDevice.cars.tile(FABIA.name)).toBeVisible({ timeout: 30_000 });
    });
  });
});
