import { test as base, expect } from "@playwright/test";
import { AppShell } from "../pages/appShell";
import { RouteSearchPanel } from "../pages/routeSearchPanel";
import { TripPanel } from "../pages/tripPanel";
import { MapView } from "../pages/mapView";
import { MainMenu } from "../pages/mainMenu";
import { SignInPanel } from "../pages/signInPanel";
import { CarsPage } from "../pages/carsPage";
import { ProfilePage } from "../pages/profilePage";
import { Device } from "../pages/device";
import { PriceApi } from "../api/priceApi";
import { FirebaseEmulator } from "../api/firebaseEmulator";
import { FirestoreRules } from "../api/firestoreRules";

type FuelPlanFixtures = {
  app: AppShell;
  routeSearch: RouteSearchPanel;
  trip: TripPanel;
  mapView: MapView;
  menu: MainMenu;
  signIn: SignInPanel;
  cars: CarsPage;
  profile: ProfilePage;
  priceApi: PriceApi;
  emulator: FirebaseEmulator;
  /** A second browser, as if the same person used FuelPlan on another device. */
  otherDevice: Device;
  /** firestore.rules running in the Firestore emulator, emptied before each test. */
  rules: FirestoreRules;
  /** Uncaught errors thrown on the page during the test. */
  pageErrors: string[];
};

/** Playwright `test` with FuelPlan page objects and API clients injected. */
export const test = base.extend<FuelPlanFixtures>({
  app: async ({ page }, use) => use(new AppShell(page)),
  routeSearch: async ({ page }, use) => use(new RouteSearchPanel(page)),
  trip: async ({ page }, use) => use(new TripPanel(page)),
  mapView: async ({ page }, use) => use(new MapView(page)),
  menu: async ({ page }, use) => use(new MainMenu(page)),
  signIn: async ({ page }, use) => use(new SignInPanel(page)),
  cars: async ({ page }, use) => use(new CarsPage(page)),
  profile: async ({ page }, use) => use(new ProfilePage(page)),
  priceApi: async ({ request }, use) => use(new PriceApi(request)),
  emulator: async ({ request }, use) => use(new FirebaseEmulator(request)),
  otherDevice: async ({ browser, baseURL, viewport }, use) => {
    const context = await browser.newContext({ baseURL, viewport });
    await use(new Device(await context.newPage()));
    await context.close();
  },
  rules: async ({}, use) => {
    const rules = await FirestoreRules.start();
    await rules.clear();
    await use(rules);
    await rules.stop();
  },
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(errors);
  },
});

export { expect };
