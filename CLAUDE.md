# FuelPlan

Hungarian trip and fuel-cost calculator ("ReFuel" in code). The user picks a route on Google Maps, with options to avoid highways, tolls or ferries. The route distance goes into a calculator: `distance / 100 × consumption (L/100km) × price (HUF/L)`. The result is shown one-way and return, and split per passenger. Live average fuel prices are scraped from holtankoljak.hu by a small server.

## Stack
- **Frontend**: Create React App (`react-scripts` 5), React 18, TypeScript 4.9, Chakra UI v3. `src/components/ui/*` are stock Chakra snippets; avoid editing them.
- **Maps**: `@react-google-maps/api` (`LoadScript` with the `places` library, `Autocomplete`, `DirectionsService` and `DirectionsRenderer`).
- **Layout**: a full-screen map with overlays and a main menu (Plan, Cars, Profile). On desktop a left rail plus a floating panel; on mobile a route card pinned to the top, `react-spring-bottom-sheet` and a bottom tab bar.
- **Accounts and saved cars**: Firebase Auth (Google and email link; Apple was dropped on 2026-10-25 until there is an Apple Developer account) and Cloud Firestore, used straight from the browser with the modular SDK (`firebase` v12). Dev and tests run against the **local Firebase emulators**, never production.
- **Design**: "Bold & friendly", Fuel Green palette (redesign shipped 2026-10-24). Design work lives in [planning/](planning/) (start with its README): `prototype/fuelplan.html` (clickable, Hungarian), `screen-specs/`, `technical-plans/`. Tokens are in [src/theme.css](src/theme.css).
- **Server** (`server/`, separate package): Express 5 + Playwright (headless Chromium). ESM, run through `node --loader ts-node/esm`.

## Layout and data flow
- [src/App.tsx](src/App.tsx) owns all shared route state:
  - `stops`, `directions`, `requestDirections`, `routeError`, `fromLocation` and the `avoid*` flags.
  - It bundles them into one `RouteCardProps` object (`route`), which is passed to whichever container is shown.
  - Toggling an Avoid flag re-plans a route that is already shown.
- **Stops**: `stops: RouteStop[]` (`{ id, place }`, with stable ids for React keys and reordering).
  - The first entry is the start, the last is the destination, and the ones in between become Directions `waypoints` in the user's order (`optimizeWaypoints: false`).
  - `place` is a `RoutePlace`: typed or picked text, `""` while empty, or the user's `LatLngLiteral`, which is shown as a blue "Your location".
  - **Every change goes through `changeStops`**. It re-plans as soon as all places are filled in (`isComplete`); an added but empty stop leaves the current route alone.
  - "Add stop" inserts before the destination (up to `MAX_STOPS` = 10). ✕ removes a place; it's shown only when there are more than two. A drag (or the arrow keys on the handle) reorders.
  - Async callbacks (Google's place picks, the location fix) read the latest list through `stopsRef`, never a stale render's `stops`.
  - Stop ids are random (`Date.now` + `Math.random`), **not a module-level counter**. A dev-server hot reload re-runs the module, which restarted a counter at 0 while the page kept its stops. That created duplicate React keys, and React left orphaned rows that couldn't be deleted.
  - A drag that started on a different list (stops changed mid-drag) is ignored. `lostpointercapture` also ends a drag.
  - Find my location (`startFromMyLocation`) sets the first place. When the list is complete, it re-plans with `fitToRoute = false`, so the map stays on the user instead of zooming back out to the route.
  - On mount it calls `helper.getFuelPrice()` to wake up the Cloud Run server (cold start).
- [src/isMobile/isMobile.tsx](src/isMobile/isMobile.tsx) (breakpoint 900px) switches between [desktopPanel.tsx](src/desktopPanel/desktopPanel.tsx) and [bottomSheet.tsx](src/mobile-bottomsheet/bottomSheet.tsx). **Both render `RouteCard` and `TripDetails`, so new route state goes into `RouteCardProps`.**
- [routeCard.tsx](src/routeCard/routeCard.tsx): the list of place rows, "Add stop", the Avoid chips, the "Finding the best route…" status and the inline no-route error.
  - It owns the drag state: the rows reorder live under the pointer, and the order is committed with `onReorderStops` once, on drop.
  - Rows are labelled Start / Stop 1… / Destination, and tests find fields, ✕ and handles by these labels.
- [stopField.tsx](src/routeCard/stopField.tsx): one row: a marker, a field with its own Places `Autocomplete` and a drag handle *inside* the field, and ✕.
  - There is no Search button. Picking a suggestion, or pressing Enter on typed text (Google then gives only `place.name`), sets the place.
- [tripDetails.tsx](src/tripDetails/tripDetails.tsx) owns its own state: distance, consumption, fuel type, price, passengers and one-way/round trip.
  - **The cost is live**: there's no Calculate button. When values are missing, the cost card shows an inline hint ("Add the … to see the cost.").
  - Distance comes from the route and stays editable.
  - On mount it loads prices and fills **today's average for the selected fuel type, matched by name**.
  - The ↻ button **fetches again** from the server, which takes a few seconds while the server scrapes the site. The icon spins (`aria-busy`) and the note says "Checking today's prices…".
  - Number inputs accept only digits and one `,`/`.` (`toDecimalInput`).
  - **All route totals come from [routeTotals.ts](src/routeSummary/routeTotals.ts), which sums every leg.** With stops, Google returns one leg per section, so never read `legs[0]` alone. This covers the trip distance, the summary and the map bubble.
  - [routeSummary.tsx](src/routeSummary/routeSummary.tsx) shows the duration and length. It sits at the top of the desktop trip card, and in the sheet's non-scrolling `header` on mobile.
  - Rounding: the total is rounded from the exact litres, and per person = total / passengers.
- [desktopPanel.tsx](src/desktopPanel/desktopPanel.tsx): a floating 400px panel next to the rail, with the route card and the trip card. On desktop the cost card is reordered to the bottom with CSS `order`.
- [bottomSheet.tsx](src/mobile-bottomsheet/bottomSheet.tsx): the route card is pinned to the top; `TripDetails` sits in the sheet, which sits on the tab bar (`maxHeight` = screen − tab bar).
  - Snap points (2026-10-25, the user's choice): a peek, where it opens, and a top position where sheet + tab bar cover 75% of the screen (never over the route card). **The peek is measured live** (`usePeekHeight`: sheet header + the whole cost card + 12px, via ResizeObserver), so it fits the hint and, a little taller, the calculated cost. A sheet that isn't at the top follows peek changes (`snapTo`; also once after the opening animation, which ignores `snapTo`), and its content scrolls back to the top at the peek so no input rows show under the card. On phones the cost card is a grid: a small One way / Round trip switch on the "Fuel cost" line. Tests that type into the trip or open the car picker on a phone must drag the sheet up first (`AppShell.revealTripInputs`).
  - The route card and the cost card are slimmer on phones (route card 138px tall at 390×844), so at least 40% of the screen stays map (there's a test for this).
  - The location button's slot follows the sheet only up to half the screen (`min(--rsbs-overlay-h, 50%)`). Above that the sheet slides over it.
  - The cost card is `position: sticky`, so it stays visible while the inputs scroll.
  - This needed `[data-rsbs-content] { overflow: visible; display: flow-root }`, because the library's `overflow: hidden` breaks sticky.
- [googleMap.tsx](src/googleMap/googleMap.tsx):
  - Full screen. `DirectionsService` is mounted while `requestDirections` is true, and its callback sets `directions` (or calls `onRouteError`).
  - It fits a new route (only when `fitToRoute`) into the area not covered by the panel or sheet, and draws it in brand green.
    - `routePadding` measures the real elements and leaves room for the pins.
    - `isFractionalZoomEnabled` lets the fit be snug instead of jumping to whole zoom levels.
    - `preserveViewport` is set on the renderer.
  - If an InfoWindow is ever added back, give it `disableAutoPan` (otherwise opening it drags the map away from the user) and `headerDisabled` (to drop its close button). Never hide `.gm-ui-hover-effect` with CSS: that also hid the close button on Google's own place cards, so they got stuck.
  - [useOneFingerZoom.ts](src/googleMap/useOneFingerZoom.ts) adds the Google Maps app's one-finger zoom, which the JS map lacks: double-tap, hold, then slide down to zoom in or up to zoom out (120px per level), anchored on the tapped spot.
    - It listens in the capture phase on the map div. The second tap is recognised on `pointerdown`, which fires before `touchstart`, so Google never starts a pan.
    - During the gesture it blocks pointer and touch events from reaching Google.
    - A plain double-tap still zooms +1, and a second finger (pinch) cancels the gesture.
    - Tests drive it with real touch input through Chrome's DevTools protocol (`MapView.doubleTapAndSlide`).
  - `clickableIcons: false`: tapping Google's place icons would open place cards the app doesn't use. In Safari they crash inside Google's `onion.js` ("null is not an object (evaluating 'c.place=b')").
  - Map-type control off; fullscreen control off on mobile. Both would sit under the panel or route card.
  - Route markers: one lettered marker per place (A = start, …), titled `"<letter>: <address>"`. Google's own markers are suppressed (`suppressMarkers`).
    - The red `fromLocation` marker shows only until a route exists.
    - Google puts a marker's title on a hidden `<area>`, so in Playwright count markers or check their attributes; don't wait for them to be visible.
  - There's no info bubble on the route (removed 2026-10-24): the route summary in the panel or sheet shows the totals.
  - **Route options** (2026-10-25): the request sets `provideRouteAlternatives`. Google returns alternatives **only for routes without stops**.
    - App holds `routeIndex` (reset to 0 for every new result) and passes `routes: RouteChoice` (`directions`, `routeIndex`, `onSelectRoute`, in [routeTotals.ts](src/routeSummary/routeTotals.ts)) to the map and both containers. `routeTotals(directions, routeIndex)` gives the chosen route's totals.
    - Map: the chosen route via `DirectionsRenderer` `routeIndex` (dark green, zIndex 3); the others as light green `Polyline`s (`#8fd3bb`) with an invisible 28px-wide `Polyline` on top that takes the taps.
    - A new route is fitted with all options in view; choosing another option doesn't move the map.
    - TripDetails shows a "Route options" row of chips ("2 h 24 min · 233 km") when there's more than one, so the choice also works without the map (keyboard, screen readers, tests).
- [locateButton.tsx](src/locateButton/locateButton.tsx): the "Find my location" button.
  - It's rendered through a portal.
    - Desktop: a native Google Maps control at RIGHT_BOTTOM, via `map.controls`.
    - Mobile: it goes into the bottom sheet's `sibling` slot (`SHEET_MAP_CONTROLS_CLASS`). That slot floats above the sheet using react-spring-bottom-sheet's `--rsbs-overlay-h` CSS variable, so the button follows the sheet as it moves.
  - Icon: Google Maps' "you are here" dot, built from two Chakra `Box` circles (blue dot with a white ring on a pale blue halo). It's not a font icon. The button is a rounded square (14px corners) on mobile, as in the Google Maps app.
  - It uses `navigator.geolocation`, pans and zooms the map, and reports the position to `googleMap.tsx`, which draws the blue "Your location" dot.
  - Errors appear in [alertComponent.tsx](src/alertComponent/alertComponent.tsx), a toast rendered through `createPortal(..., document.body)` that auto-hides after 3s. It's now used only for location errors.
- **Menu and screens** ([navigation/](src/navigation/)): App holds `view` ("plan" | "cars" | "profile") in `ViewContext` (`useView()`), so deep components can switch screens.
  - [mainNav.tsx](src/navigation/mainNav.tsx): the dark rail (desktop, `--rail-w` 84px) or the tab bar (phone, `--tab-bar-h`). Profile is last and shows the user's initials when signed in. The active item has `aria-current="page"`.
  - Cars and Profile render in `.side-view`: a floating card next to the rail on desktop, full screen above the tab bar on phones.
  - **The trip stays mounted on other screens** so nothing is lost: the desktop panel gets `hidden`, and on phones `body[data-view]` CSS hides the route card and sheet with `visibility: hidden` (not `display: none`, which would break the sheet's measurements).
  - The map container is inset by `--rail-w` / `--tab-bar-h`; `routePadding` measures from the map's own edges.
- **Accounts** ([firebase/firebase.ts](src/firebase/firebase.ts), [auth/useAuth.tsx](src/auth/useAuth.tsx)):
  - `REACT_APP_FIREBASE_EMULATORS=true` → demo project `demo-fuelplan`, Auth emulator on 9099, Firestore on 8080. Otherwise the `REACT_APP_FIREBASE_*` config. Without either, `accountsAvailable` is false and Cars/Profile say accounts aren't available; the calculator works as before.
  - Firestore uses the persistent multi-tab cache (offline edits sync later). `clearLocalData()` terminates Firestore, clears IndexedDB and starts it again: called on sign-out and account deletion, so cars don't stay on shared computers.
  - `AuthProvider` / `useAuth()`: Google popup sign-in (`signInWithPopup`), email link (address kept in `localStorage` `fuelplan.emailForSignIn`), sign-out, delete account. Friendly messages come back as `AuthError`; a closed popup is silent.
  - Email link: a page opened with a link signs in by itself, or asks for the email (another device), or shows "expired". The one-time code is removed from the URL at once. App opens on Profile in that case.
  - Delete account: re-auth (Google popup; email users must have signed in within 5 min) → `deleteAllUserData` (batch) → `deleteUser` → clear cache. If Apple sign-in comes back, deletion must also revoke the Apple token (`revokeAccessToken`).
  - [signInPanel.tsx](src/auth/signInPanel.tsx) is shared by Profile and Cars (signed out). The Google button follows Google's branding (dark pill, the four-colour G on a white circle, "Sign in with Google").
- **Saved cars** ([cars/](src/cars/)):
  - [carRepository.ts](src/cars/carRepository.ts): `users/{uid}/cars/{carId}` (`name`, `fuel` "petrol95" | "diesel", `consumption` 1–40, `color` "#rrggbb", client `createdAt`/`updatedAt`) and `users/{uid}.defaultCarId`. Auto-ids. `validateCar` mirrors [firestore.rules](firestore.rules). Writes are batched and not awaited by the UI (they apply locally at once, also offline).
  - [useCars.tsx](src/cars/useCars.tsx) `CarsProvider`: the live list (`onSnapshot`), the effective default (exactly one: a missing id falls back to the first car), sync status ("synced" / "saving" / "offline"), the trip's `selectedCar`, and the editor's open state.
    - The default car is selected once the account's cars have loaded (it waits for the server, not the empty cache right after sign-in).
    - A car added with "+ New car" in the trip's picker is used for the trip at once (`openEditor(null, { useForTrip: true })`); added on the Cars screen it isn't, except the very first car. On the next start the default car is used again.
    - Deleting the default makes the first remaining car the default.
  - [carsView.tsx](src/cars/carsView.tsx), [carEditor.tsx](src/cars/carEditor.tsx) (one instance, rendered by App), [carPicker.tsx](src/cars/carPicker.tsx), [carAvatar.tsx](src/cars/carAvatar.tsx) (dark icon on light colours).
  - In [tripDetails.tsx](src/tripDetails/tripDetails.tsx) the **Car row** opens the picker. A selected car sets consumption, fuel and today's price and hides those two rows; when it disappears (deleted, signed out) its numbers stay as Custom values, so the cost doesn't jump.
- [modal.tsx](src/modal/modal.tsx): the dialog shell (desktop dialog or dropdown under an anchor; bottom sheet on phones), focus in/out, Tab trap, Escape, backdrop click.
  - **Escape and pointer-downs are handled and stopped on the modal itself.** React events bubble through portals to the component that rendered them, and the picker is rendered inside the phone's bottom sheet, whose `onKeyDown` stops Escape and whose gestures would start a sheet drag.
  - Phone dialog sheets close when dragged down by their top bar (grabber + title, `.modal__handle`): more than 120px, or a quick flick; a short pull springs back.
  - **MainNav renders outside `.app`.** `.app` is `position: fixed`, so it is its own stacking layer, while react-spring-bottom-sheet draws at page level (z-index 6). Inside `.app` the tab bar (z-index 8) still ended up under a sheet pulled down too far.
  - **iOS:** react-spring-bottom-sheet locks body scrolling with body-scroll-lock, which blocks touch scrolling everywhere outside the sheet. Anything that must scroll while the sheet is mounted (the modal overlay, `.side-view`) carries `data-body-scroll-lock-ignore`.
- [toast.tsx](src/toast/toast.tsx): `useToast()` for short confirmations ("Signed out", "Car saved") and background errors; a `role="status"` region named "Notifications".
- [helper.ts](src/calculator/helper.ts):
  - `calculateFuelCost` treats a comma as the decimal separator. `toDecimalInput` keeps digits and one `,`/`.` (trip fields and the car editor).
  - `getFuelPrice` fetches `${REACT_APP_PROD_SERVER_URL}/scrape` and returns `FuelPriceData[]`. The prices are strings.
- [server/server.ts](server/server.ts): `GET /scrape` calls `getFuelPrices()` in [server/tests/getFuelPrice.ts](server/tests/getFuelPrice.ts).
  - That function scrapes `.d-flex.mb-3` rows → `.ar` cells (min, avg, max).
  - Rows are mapped by index to `['95-petrol', 'Diesel', '100-petrol']`.
  - [fuelPrices.json](fuelPrices.json) is a sample response.

## Conventions
- One camelCase folder per component, with its own `.css` file (BEM-style classes, e.g. `.trip__row`). Components use default exports and declare their `Props` type inline in the same file.
- **Styling**: redesigned components use plain CSS and the tokens in [theme.css](src/theme.css): `--brand-dark`, `--brand`, `--pop`, `--field`, `--radius-*`, `--shadow`, …
  - Shared building blocks live there too: `.seg` (a toggle group using `aria-pressed`), `.chip`, `.icon-btn`, `.visually-hidden` and `.ic`.
  - Chakra is still the provider and is used by `alertComponent`, `loading` and `locateButton`.
- **Dark mode** (2026-10-25): Chakra's provider runs `next-themes`, which stores the choice under `localStorage["theme"]` (`system` / `light` / `dark`) and puts `class="dark"` or `"light"` on `<html>`.
  - [theme.css](src/theme.css) redefines the tokens under `:root.dark`. **Use tokens, not hard-coded colours**, so new UI works in both. White text on `--brand-dark` cards and lime (`--pop`) buttons is fine in both themes.
  - [public/index.html](public/index.html) has an inline script that sets the class before the first paint (no white flash).
  - [appearanceSetting.tsx](src/appearance/appearanceSetting.tsx) is the System / Light / Dark switch on Profile, shown signed in or not.
  - The map uses `DARK_MAP_STYLE` (JSON `styles`, so no map ID) and brighter/dimmer route colours in dark mode, via `useTheme().resolvedTheme`. Google's place suggestions (`.pac-container`) are restyled in [style.css](src/style.css).
  - Tests: `test.use({ colorScheme: "dark" })` emulates a dark device; `AppShell.document` is `<html>`.
- **Icons**: `<Icon name="…" />` from [icons/icon.tsx](src/icons/icon.tsx), a custom SVG set on a 24px grid with a 1.75px stroke. Add new icons there; don't use Material Symbols.
- **Font**: Plus Jakarta Sans, loaded in `public/index.html`.
- **Accessibility**: give every input a `<label>` or `aria-label`. Tests find elements by role and name.
- Prettier formats on save. The UI text is English; some code comments are Hungarian.
- `--app-height` is set from `visualViewport` in App so mobile height works.

## Env vars
- Frontend `.env` (gitignored): `REACT_APP_GOOGLE_MAPS_API_KEY`, `REACT_APP_PROD_SERVER_URL`. CRA reads them at startup, so restart after changing them.
- Firebase: `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN` (the Hosting domain, so popups are same-origin), `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_APP_ID`, `REACT_APP_FIREBASE_DATABASE_ID=fuelplandb`. For tests and offline dev use `REACT_APP_FIREBASE_EMULATORS=true` instead (it ignores the others and uses the emulator's `(default)` database).
- **One Firestore for dev and production for now:** the named database `fuelplandb` in `eur3` (project `fuelplan-fbaca`). A local `npm start` without the emulator flag writes real data. The Playwright suite always uses the emulators, but it reuses whatever runs on port 3000, so stop a production-pointing dev server before running tests.
- Server: `PORT` (default 3001; the Docker image exposes 8080).

## Commands
- `npm start`: dev frontend on http://localhost:3000.
- `npm run build`: production build into `build/`.
- `cd server; npm run dev`: price server on http://localhost:3001.
- `npm run emulators`: Firebase Auth (9099) + Firestore (8080) emulators for project `demo-fuelplan`. Needs Java 21 (installed). Data is in memory and gone on restart. Start the frontend with `REACT_APP_FIREBASE_EMULATORS=true` to use them.
- To run everything locally, use the `/run-dev` skill.

## Tests
- All test scripts and test files go in [tests/](tests/). Smoke and E2E tests use **Playwright** (config: [playwright.config.ts](playwright.config.ts); the `headless` switch is in `use`).
- **Before writing or changing any test, follow the `/write-tests` skill.** It covers:
  - Page Object classes in `pages/` and `api/`, plus fixtures;
  - no unnecessary functions;
  - talkative `test.step` titles.
- `npm run test:e2e` runs everything. It starts the Firebase emulators, the price server and the frontend itself, or reuses them if they're already running. **A reused frontend must have been started with `REACT_APP_FIREBASE_EMULATORS=true` and `REACT_APP_PROD_SERVER_URL=http://localhost:3001`.**
- `npm run test:smoke` runs the UI tests in [tests/specs/ui/](tests/specs/ui/):
  - trip cost: the missing-values hint, auto-filled 95/Diesel price, refresh, live one-way/round-trip/per-person math;
  - mobile: the cost stays in view while you scroll the sheet;
  - accounts, cars, car picker, sync, navigation: against the emulators. Each spec starts with `emulator.reset()`. Google goes through the emulator's own sign-in window (`SignInPanel.completeProviderWindow`); email links come from the emulator's outbox (`FirebaseEmulator.latestSignInLink`). `otherDevice` is a second browser context for sync tests;
  - `@maps`: route search and the inline no-route message, plus Find my location. These tests need a working Maps key.
- `npm run test:scrape` runs [tests/specs/api/](tests/specs/api/). It checks that `/scrape` returns 3 plausible rows, which catches holtankoljak.hu layout changes.
- `npx playwright test --project=rules` runs [tests/specs/rules/](tests/specs/rules/): `firestore.rules` in the Firestore emulator via `@firebase/rules-unit-testing` v5 (v6 needs firebase 13).
- Reports: `npx playwright show-report`. `test-results/` and `playwright-report/` are gitignored.

## Deploy
- **Frontend**: GitHub Action [deploy_firebase.yml](.github/workflows/deploy_firebase.yml), triggered manually (`workflow_dispatch`). It builds with the secrets and deploys to Firebase Hosting (project `fuelplan-fbaca`, SPA rewrite to `/index.html`).
- **Server**: [server/Dockerfile](server/Dockerfile) builds an image that runs on Google Cloud Run.
- **Firestore rules**: [firestore.rules](firestore.rules), deployed to the `fuelplandb` database (set in `firebase.json`) with `npx firebase deploy --only firestore:rules`. The Action doesn't deploy them; if it should, its service account needs *Firebase Rules Admin*.
- **Before accounts go live** (console work, see [technical-plans/accounts-and-storage.md](planning/technical-plans/accounts-and-storage.md)): Firestore in an EU location, enable Google and Email link (passwordless), authorized domains, the `REACT_APP_FIREBASE_*` values in `.env` and the Action, the final privacy notice ([public/privacy.html](public/privacy.html) is a draft), App Check.
- [azure-pipelines.yml](azure-pipelines.yml) is only a starter stub.

## Known issues / tech debt
1. **Google deprecations:** `DirectionsService` and `DirectionsRenderer` have been deprecated since 2026-02-25 (the console warns; Google points to `google.maps.routes`). `places.Autocomplete` is legacy, and Google recommends `PlaceAutocompleteElement`. All of them still work.
2. The scraper maps rows to fuel types by index, so it breaks silently if holtankoljak.hu changes its layout. The frontend now matches prices by `fuelType` name.
3. `/scrape` launches a new browser on every request, with no caching.
4. (Fixed with stops: totals sum all legs through `routeTotals`.)
5. Without an account nothing is remembered on reload (custom values). Signed-in users have saved cars (shipped 2026-10-24).
6. (Fixed 2026-10-24: the `setTimeout`/CSS hack that hid the InfoWindow close button is gone, and so is the route InfoWindow itself.)
7. Leftover `console.log` calls in helper and googleMap.
8. Unused or misplaced deps in the root `package.json`:
   - unused: `react-pro-sidebar` (since the redesign), `react-modal-sheet`, `react-sheet-slide`, `@zag-js/*`, `styled-components`, `motion`, `@use-gesture/react`, and the `playwright` dependency (`@playwright/test` already includes it)
   - server-only: `express` and `cors`
   - version mismatch: `@types/express` v4 here vs v5 in server
9. `build/` and `.firebase/` are committed.
10. There are no unit tests yet. `calculateFuelCost` is the easiest target (CRA ships Jest via `react-scripts test`).
11. README is still the stock CRA template.
12. **Planned future features** (designed in `planning/` but not built yet): trip history and favourites, sharing the result, a HU/EN switch, Trips and Settings in the menu. Multiple stops, saved cars and accounts shipped on 2026-10-24.
13. **Accounts, still to verify or do before launch:**
    - (Done 2026-10-25: Google's branded button.)
    - **Testing on a phone:** the app address (e.g. a Cloudflare tunnel) must be in Firebase's *Authorized domains*, or Google and email-link sign-in fail (`auth/unauthorized-domain` / `auth/unauthorized-continue-uri`, shown as "Sign-in isn't enabled on <host> yet"). An email link points back to the address it was requested from, so a link asked for on `localhost` only opens on that PC. On iOS, a Google popup from a tunnel can still fail because `authDomain` is on another site (Safari blocks the cross-site storage it needs); the deployed site, where `authDomain` is the site itself, doesn't have this problem.
    - Tests: Firebase's sign-in relay iframe downloads Google's gapi script from the internet even with the emulators; when that download fails (seen on a busy network), the sign-in window never closes; `SignInPanel` then fails within 15 s with a message saying so. Re-run; it's not an app bug.
    - `fetchSignInMethodsForEmail` (used to name the existing provider on `account-exists-with-different-credential`) returns nothing when email enumeration protection is on; the message then stays generic.
    - Deleting an email-link account needs a sign-in within the last 5 minutes; otherwise the user is asked to sign in again with a new link.
    - Data deletion is client-side; a crash between deleting the cars and `deleteUser` could leave an empty account (a Cloud Function would need the Blaze plan).
    - The emulator email links are opened directly in tests; the real email template and the `/__/auth/action` flow in production are untested.
