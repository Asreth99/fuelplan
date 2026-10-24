# Saved cars ("Autók")

Status: **built in the app on 2026-10-24** (English labels, Firebase emulator for dev and tests). One change from this spec: any new car saved while the trip uses Custom values is selected, as the prototype does, not only one added from the picker. Changed after testing (2026-10-25): the custom colour is a dashed circle with a palette icon instead of the rainbow swatch, the dialog shows a live preview of the car badge, and the Fuel price row carries a fuel tag (e.g. Diesel), since a selected car hides the fuel type row.

- Prototype: [prototype/fuelplan.html](../prototype/fuelplan.html). Click **Autók** in the side rail (desktop) or the bottom bar (phone), or click the trip card's **Autó** row.
- Screenshots: [screenshots/cars/](../screenshots/cars/).
- Code of the mock: [cars.js](../prototype-code/cars.js), [cars.css](../prototype-code/cars.css).

## Why
Today, every trip starts by typing the consumption and picking the fuel type. Most people drive one or two cars, so FuelPlan should remember them: pick a car once, and the consumption, fuel type and today's price for that fuel are filled in.

## Navigation
The app gets a main menu with **only features that exist: Plan and Cars, plus Profile** (desktop: bottom of the rail; phone: last tab; see [profile.md](profile.md)). Trips and Settings are added when they're built, so there are no dead buttons.

| | Desktop (≥900px) | Phone |
|---|---|---|
| Menu | Slim left rail (84px): logo, Plan, Cars | Bottom tab bar: Plan, Cars |
| Plan | Floating panel (route card + trip card) next to the map | Route card on top, trip details in the bottom sheet |
| Cars | The floating panel shows the cars list; the map stays behind | Full-screen cars list above the tab bar |

The active item uses B's style: a lime pill in the rail, and a dark pill with a lime icon in the tab bar. It's marked with `aria-current="page"`.

## Cars list
- **Header:** the title "My cars" and a count ("3 saved cars"), with a primary **New car** button (lime pill).
- **One tile per car:**
  - a round badge in the car's colour, with a car icon;
  - the name, bold;
  - `6.5 L/100 km · Diesel`;
  - a lime **Default** badge on the default car;
  - an edit pencil.

  **Tapping the tile edits the car**; there's no separate edit mode.
- **Empty state:** a large soft car icon, then "No saved cars yet", a one-sentence explanation, and one **Add a car** button. The header button is hidden here, so there's a single clear action.
- **Footnote:** "Your cars are in your account, on all your devices."

## Add / edit a car
A centred dialog (440px) on desktop and a bottom sheet with a grabber on phones. The first field gets focus. Escape, the ✕ or clicking outside closes it.

| Field | Control | Rules |
|---|---|---|
| Name | Text, max 30, placeholder "e.g. Family Golf" | Required: "Give the car a name." |
| Fuel | Segmented: 95 Petrol / Diesel (the two the app prices today) | Default: Diesel |
| Average consumption | Number + `L/100 km`. Accepts only digits and one `,`/`.`, like the trip fields | 1–40: "Enter a value between 1 and 40 L/100 km." Hint: "From the trip computer or the car's papers." |
| Colour | 6 preset swatches (green, blue, coral, amber, violet, graphite), **plus a 7th rainbow "+" swatch for any colour** | A new car gets the next preset, so new cars differ. The custom swatch is a native `<input type="color">`: an RGB/HSL/HEX dialog on desktop and the colour sheet on iOS/Android. Once picked, the swatch fills with the colour and keeps a thin rainbow ring. A car saved with a non-preset colour reopens with the custom swatch selected |
| Default car | Switch: "We use this car when you open the app" | The first car is always the default. Exactly one car is the default |

- **Validation is inline,** shown on Save under the field (`aria-invalid`), and focus goes to the first wrong field.
- **Delete** (edit mode only) sits bottom-left, away from Save. It asks once more **inline**, "Delete Golf VII? [Cancel] [Delete]", not with a browser `confirm()`, which the iOS Safari home-screen app suppresses.
- **If the deleted car was in use,** the trip keeps its values as "Custom", so the cost doesn't jump. If it was the default, the first remaining car becomes the default.

## In the calculator: the car picker
The trip card's **Car** row shows `Golf VII · 6.5 L/100 km · Diesel` with the car's colour on the icon. Clicking or tapping it opens the picker: a dropdown under the row on desktop, a bottom sheet on phones.
- The title is "Which car are you taking?" The saved cars are listed as radio options, with the current one ticked.
- **Custom values** sits last: "Enter consumption and fuel by hand".
- **Footer links:** "+ New car" (opens the editor; after saving, the new car is selected if Custom was active) and "Manage cars" (goes to Cars).

**Picking a car sets three things at once:** the consumption, the fuel type, and today's average price for that fuel. The cost updates live, as it does today.

- **With "Custom",** the trip card shows today's two rows: Consumption and Fuel type. That's the path for people who never save a car.
- **When the app opens,** the default car is selected. With no cars saved, Custom is selected, which is exactly today's app.

**Readable on any colour:** the car icon on a colour badge is white, but switches to dark green (`#0a3d33`) when the colour is light (perceived brightness > 70%). A faint inner outline keeps near-white badges visible on white cards. This applies everywhere a badge appears: list, picker and the trip card.

## Data and storage
**Cars live in the cloud, per account (Firebase Firestore).** Saving cars requires signing in; see [profile.md](profile.md). The full technical plan is in [technical-plans/accounts-and-storage.md](../technical-plans/accounts-and-storage.md).
```ts
// users/{uid}/cars/{carId}
type Car = {
  id: string;            // Firestore auto-id: random (never a module-level counter)
  name: string;          // 1–30 characters
  fuel: "petrol95" | "diesel";
  consumption: number;   // L/100 km, 1–40
  color: string;         // "#rrggbb": a preset or any custom colour
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
// users/{uid}: { defaultCarId: string | null }. One field, so there's always exactly one default.
```
- **Validation lives in both places,** in the client (friendly messages) and in the Firestore security rules (the real guard).
- **Offline:** the persistent local cache keeps the list usable offline and syncs edits later. Changes on one device appear on the others live.
- **The mock** fakes this with `CloudStore` in [account.js](../prototype-code/account.js): `localStorage` keyed by user. It stores an `isDefault` flag per car; the app uses `defaultCarId` instead.

**Signed out:**
- the Cars screen shows the sign-in panel;
- the trip card's picker offers only Custom values, plus a "sign in" link;
- the calculator works as today.

## Mock labels → English app labels
| Mock (HU) | App (EN) |
|---|---|
| Tervezés / Autók | Plan / Cars |
| Autóim · 3 mentett autó | My cars · 3 saved cars |
| Új autó / Autó hozzáadása | New car / Add a car |
| Alapértelmezett | Default |
| Még nincs mentett autód | No saved cars yet |
| Név · Üzemanyag · Átlagos fogyasztás · Szín | Name · Fuel · Average consumption · Colour |
| Egyéni szín (választása) | Custom colour (pick a custom colour) |
| 95 benzin / Dízel | 95 Petrol / Diesel |
| Alapértelmezett autó | Default car |
| Mentés / Mégse / Törlés | Save / Cancel / Delete |
| Melyik autóval mész? | Which car are you taking? |
| Egyéni értékek | Custom values |
| Autók kezelése | Manage cars |
| Az autóid a fiókodban vannak: minden eszközödön elérhetők. | Your cars are in your account, on all your devices. |

## Building it (later, when code changes are allowed again)
Build accounts first: see [technical-plans/accounts-and-storage.md](../technical-plans/accounts-and-storage.md).
1. **`useCars` hook:**
   - the live Firestore list (`onSnapshot`) and `defaultCarId`;
   - add / update / remove / setDefault;
   - sync status.
2. **Navigation:**
   - App gets a `view` state ("plan" | "cars" | "profile").
   - `DesktopPanel` gets a sibling `NavRail`, and the mobile layout gets a `TabBar`.
   - The map and the location button stay mounted (on phones the cars view covers them).
   - Note: the mobile bottom sheet's height maths must allow for the tab bar's height.
3. **`CarsView`, `CarEditor`, `CarPicker`** components, each in its own folder with a `.css` file, following the existing conventions. The editor and picker share one modal shell: a dialog/dropdown on desktop and a sheet on phones.
4. **`TripDetails`:** a Car row with the picker. Consumption and fuel come from the selected car, or from today's inputs when Custom is selected. The price auto-fill already follows the fuel type.
5. **Tests** (per `/write-tests`): a `CarsPage` page object, and specs for:
   - add, with validation;
   - edit;
   - delete with confirmation;
   - default moving to another car;
   - persistence across a reload;
   - the picker updating consumption, fuel, price and cost;
   - custom values;
   - the empty state;
   - the menu on both layouts.
