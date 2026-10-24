---
name: write-tests
description: How to write or change FuelPlan tests. Playwright, Page Object classes in separate folders, fixtures, and talkative test.step calls. Use whenever adding, editing, refactoring or reviewing anything under tests/, or when asked to write a smoke, E2E, UI or API test.
---

# Writing FuelPlan tests

All tests are **Playwright** (`@playwright/test`) and live in `tests/`. The code must look clean: small classes, no unnecessary functions, and specs that read like a story.

## Folder structure

```
tests/
  fixtures/index.ts      extends Playwright `test` with page objects and API clients
  pages/                 Page Object classes, one per UI area
    appShell.ts          open/reload the app, open a link, Escape, offline; drag the mobile bottom sheet; toasts
    routeSearchPanel.ts  start/destination autocomplete, stops, inline route error
    tripPanel.ts         trip inputs, the Car row and car picker, the live cost card
    mapView.ts           Find my location button, location marker, placement vs. sheet and route card
    mainMenu.ts          rail / tab bar items and the Cars and Profile screens
    signInPanel.ts       Google/email-link sign-in, incl. the emulator's Google window
    carsPage.ts          My cars list and the add / edit / delete dialog
    profilePage.ts       account card, sync status, sign out, delete account
    device.ts            a second browser context with its own page objects (fixture `otherDevice`)
  api/
    priceApi.ts          client for the price server (`/scrape`)
    firebaseEmulator.ts  resets the Auth/Firestore emulators; reads sign-in links from its outbox
    firestoreRules.ts    firestore.rules in the emulator, acting as a given user (fixture `rules`)
  data/                  static test data only (constants and types), no logic
    trips.ts, fuelTypes.ts, devices.ts, locations.ts
    accounts.ts, cars.ts, storedCars.ts
  utils/                 small classes that compute expected values
    expectedCost.ts
  specs/
    ui/*.spec.ts         browser tests  (Playwright project `smoke`)
    api/*.spec.ts        API-only tests (Playwright project `scrape`)
    rules/*.spec.ts      Firestore security rules (Playwright project `rules`, no browser)
```

- **Accounts in tests**: always the local emulators (project `demo-fuelplan`), never production. Start every account/cars spec with an "empty emulator" step (`emulator.reset()`).
- The bottom sheet on phones is itself a `role="dialog"`, so name dialogs in locators (`getByRole("dialog", { name: … })`).

- File names are camelCase (like the app); class names are PascalCase, one class per file.
- A new UI area gets a new class in `pages/`, not new functions in a spec.
- A new backend endpoint gets a method on a class in `api/`.

## Rules

1. **Specs contain only `test.describe`, `test`, `test.step` and `expect`.** No helper functions, no locators and no raw selectors in spec files. Everything reusable lives in a class.
2. **Page Objects**:
   - Expose locators as `readonly` fields assigned in the constructor.
   - Expose user actions as `async` methods named after what the user does (`searchRoute`, `selectFuelType`, `fillTrip`).
   - Contain no `expect` assertions. The one exception is a wait that is part of the action itself (e.g. `expandBottomSheet` waits until the sheet has settled).
   - Make internal steps `private`.
   - Return from a navigation method (opening a panel, tab or dialog) only once the UI has **settled**. Wait for a concrete "animation finished" signal rather than a fixed timeout.
     - Example: `AppShell.expandBottomSheet` waits for the sheet's `data-rsbs-state="open"` after the drag.
     - Why: clicking inside a panel that is still sliding open can miss. Playwright's stability check passes if the animation hasn't started yet. This caused a flaky failure on 2026-10-24, with the old sidebar.
3. **Fixtures, not `new`**: specs get objects from `tests/fixtures` (`app`, `routeSearch`, `trip`, `mapView`, `menu`, `signIn`, `cars`, `profile`, `otherDevice`, `priceApi`, `emulator`, `rules`). Always import `{ test, expect }` from the fixtures, never from `@playwright/test` directly. A new class must also be registered in `fixtures/index.ts`.
4. **No unnecessary code**:
   - Don't add a method until a test uses it, and don't add wrapper methods that only rename one Playwright call. Expose the locator instead.
   - Remove any code a test no longer uses.
   - Avoid one-line "utils" files. Merge the logic into the class that needs it.
5. **Data in `data/`**: magic values (trip distances, fuel types, cities) go in `data/` as typed constants. Use a list plus a `for` loop to parametrize instead of copy-pasting tests.
6. **Expected values mirror the app's logic**:
   - Compute them in `utils/` classes that replicate exactly what the UI does (including rounding order).
   - Get live values (like fuel prices) from `priceApi`; never hardcode them.
7. **Locators**:
   - Order of preference: `getByRole` (with `exact: true` when names overlap, e.g. the "Start" textbox vs other names that contain "start"), then `getByPlaceholder`, then `getByText`. `getByTestId` is only for values with no accessible name, such as `total-cost`.
   - Use CSS or attribute selectors only for third-party widgets (`.pac-item`, `.gm-style-iw`, `[data-rsbs-overlay]`).
8. **Comments**: only where something is non-obvious (e.g. why a timeout is long). Every class gets a one-line doc comment.

## Talkative `test.step`

Every test is split into `test.step` calls. Each step title is a full sentence a non-developer would understand. It says **what the user does** or **what we expect to see**, including concrete values, so the HTML report reads like a manual test script.

```ts
await test.step("Open FuelPlan; the trip panel is visible next to the map", ...);
await test.step(`Enter a ${trip.distanceKm} km trip at ${trip.consumption} L/100km for ${trip.passengers} passengers`, ...);
await test.step(`Expect the price field to show today's ${fuel.label} average (${average} Ft/L)`, ...);
```

- Write steps for setup too (`beforeEach`), not just the actions.
- Assertion steps start with **"Expect …"**.
- A step can return a value: `const average = await test.step("Ask the price server for …", () => priceApi.getAverage(fuel.serverName));`
- Don't nest steps more than one level deep.

## Spec template

```ts
import { test, expect } from "../../fixtures";
import { SHORT_TRIP } from "../../data/trips";

test.describe("Trip cost on desktop", () => {
  test.beforeEach(async ({ app }) => {
    await test.step("Open FuelPlan; the trip panel is visible next to the map", async () => {
      await app.open();
    });
  });

  test("shows the cost as soon as the trip is filled in", async ({ trip }) => {
    await test.step(`Enter a ${SHORT_TRIP.distanceKm} km trip at ${SHORT_TRIP.consumption} L/100km`, async () => {
      await trip.fillTrip(SHORT_TRIP);
    });

    await test.step("Expect a fuel cost to appear without pressing any button", async () => {
      await expect(trip.totalCost).toBeVisible();
    });
  });
});
```

## After developing a feature: run the smoke tests until green

Every feature or bug fix is finished only when **all** smoke tests pass:

1. Add or extend tests for the new behaviour (following the rules above).
2. Run `npm run test:e2e`.
3. If anything fails, investigate. Read the error, the failure screenshot and the trace in `test-results/` (`npx playwright show-trace <trace.zip>`), and the app's console output. Find the root cause.
4. Fix the cause, whether it's in the app or in the test, then re-run **only the failing or changed spec files** (`npx playwright test tests/specs/ui/<file>.spec.ts`, or `-g "<title part>"`). Repeat until they pass. Run the whole suite again only at the end, when the app code changed since the last full run.
   - When the change is just one or two test files (no app code), run only those files, never the full suite. A full run takes 3–7 minutes and costs time and tokens (the user's rule, 2026-10-25).
5. Report the final result honestly, with the pass/fail count.

Two limits on what counts as a fix:
- **Don't weaken a test to make it pass.** Deleting assertions, adding `test.skip`, loosening expectations or raising timeouts without a reason isn't a fix. A test may change only when the test itself was wrong; say so in the report.
- **Stop and ask the user if a failure is outside the code.** Examples: a missing or invalid Maps key in `.env`, holtankoljak.hu being down, or no network. Don't keep retrying.

## Running

- `npm run test:e2e` runs everything; `npm run test:smoke` runs the UI tests; `npm run test:scrape` runs the API tests.
- Run one test with `npx playwright test -g "<title part>"`.
- The config starts the servers or reuses running ones, and runs headed.
- Tests tagged `@maps` need a valid `REACT_APP_GOOGLE_MAPS_API_KEY`.
- After writing or changing tests, **run them and report the real result**. Reports: `npx playwright show-report`.
