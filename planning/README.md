# FuelPlan: planning

Design work for FuelPlan: prototypes, screen specs and technical plans. **Nothing in this folder is app code.** The prototypes are plain HTML, CSS and JS with mock data and a stylised map, so no Google Maps key or Firebase account is needed. They're in Hungarian; the app itself is English, and every spec maps the labels.

## Start here
| Open | What it is |
|---|---|
| [prototype/fuelplan.html](prototype/fuelplan.html) | **The prototype of the chosen design** (B, Fuel Green), clickable: plan a trip, the **Autók** (Cars) and **Profil** (Profile) menus, the car picker on the trip card's **Autó** row |
| [prototype/design-directions.html](prototype/design-directions.html) | How the design was chosen: three visual directions compared |
| [prototype/colour-palettes.html](prototype/colour-palettes.html) | Direction B in six colour palettes (Fuel Green was picked) |
| [screen-specs/](screen-specs/) | What each screen does and how it behaves: [cars.md](screen-specs/cars.md), [profile.md](screen-specs/profile.md) |
| [technical-plans/](technical-plans/) | How features are built: [accounts-and-storage.md](technical-plans/accounts-and-storage.md) (Firebase Auth + Firestore) |
| [screenshots/](screenshots/) | Every prototype state at phone (390px) and desktop (1440px) size |

## Folder layout
| Folder | Contents |
|---|---|
| `prototype/` | The pages to open in a browser. `fuelplan.html` is the main one; `direction-a-clean.html` and `direction-c-dark.html` are the directions that weren't chosen |
| `screen-specs/` | One spec per feature: layout, behaviour, validation, edge cases, English labels |
| `technical-plans/` | Architecture, data model, security, testing and deployment plans |
| `screenshots/` | `directions/`, `palettes/`, `cars/`, `profile/` |
| `prototype-code/` | The code behind the prototype pages, which you don't need to open, plus the screenshot tool. Each feature is a JS + CSS pair: `cars.js/.css`, `account.js/.css`; `shared.js` (screen, icons, map, cost logic), `layout.css`, `views.js` (menu, modal, toasts) |

**Updating screenshots** (from the repo root): `node planning/prototype-code/screenshot.cjs [filter]`. For example, `profile` only recaptures the profile states. Prototype states can be opened directly with URL options such as `fuelplan.html?view=cars&auth=signedin`; each script lists its options at the top.

## Status
- [x] **Visual directions:** three styles compared. **B, "Bold & friendly"** was chosen, in the **Fuel Green** palette.
- [x] **Redesign shipped** in the app (2026-10-24): today's features, plus multiple stops.
- [x] **Saved cars** ([spec](screen-specs/cars.md)): **built** (2026-10-24).
- [x] **Profile and accounts** (Firebase; Apple, Google, email link; [spec](screen-specs/profile.md), [technical plan](technical-plans/accounts-and-storage.md)): **built** against the Firebase emulator (2026-10-24). Production setup in the Firebase console is still to do.
- [ ] Later, designed in the first concept but not specified yet: trip history and favourites, sharing the result, the HU/EN switch, settings.

## Core concept
1. **One flow on one screen: route → car → cost.** The cost is always visible and updates live. Missing inputs show inline hints instead of an alert.
2. **Map first.**
   - Phone: the route card on top, the trip details in a bottom sheet, the tab bar below.
   - Desktop: an icon rail, a floating panel and a full-bleed map.
3. **Navigation with only what exists:** Plan · Cars, and Profile.
4. **Smart defaults.**
   - Today's average price is filled in automatically, with the min–max range shown; you can override it.
   - The default car is selected on start.
   - The passenger count drives the per-person cost.
5. **The result is the hero:** the total cost, the cost per person, and a One-way / Round-trip switch.

## Mock trip used in the prototype
Budapest, Keleti pu. → Szolnok → Debrecen, Nagytemplom:
- 231 km, 2 h 25 min;
- Golf VII, 6.5 l/100 km, Diesel at 709.4 Ft/l;
- 2 passengers.

Result: one way **10 652 Ft** (5 326 Ft per person); round trip 21 303 Ft.
