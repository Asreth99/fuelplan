---
name: run-dev
description: Run FuelPlan locally. Starts the Express/Playwright price server, the Firebase emulators and the React frontend, then smoke-tests route search, price refresh and the calculation. Use when asked to run, start, preview or screenshot the app or server, or to check that a change works in the real app.
---

# Run FuelPlan locally

The shell is Windows PowerShell 5.1: chain commands with `;` (not `&&`) and set env vars with `$env:NAME='value'`.

## 0. Node.js
- Node 24 LTS was installed with winget on 2026-10-24.
- If `node` isn't found, the shell may have a stale PATH. Prefix each command with:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');`

## 1. Check env
- The root `.env` must contain `REACT_APP_GOOGLE_MAPS_API_KEY` and `REACT_APP_PROD_SERVER_URL`.
- Claude Code blocks access to `.env`. Don't try to read it; ask the user to confirm it exists, or check whether the map loads.
- If the Maps key is missing, **stop and ask the user**. Never invent or hardcode keys, and never print the key value.

## 2. Install deps (only if missing)
- If root `node_modules/` is missing, run `npm install`.
- If `server/node_modules/` is missing, run `cd server; npm install; npx playwright install chromium`.

## 3. Start the price server (background)
- Run `cd server; npm run dev` with `run_in_background`. It listens on port 3001 (`PORT` overrides).
- Check it with `Invoke-RestMethod http://localhost:3001/scrape`. The first call takes several seconds.
- Expect 3 rows: `95-petrol`, `Diesel` and `100-petrol`, each with `minimum`, `average` and `maximum` as strings. See [fuelPrices.json](../../../fuelPrices.json) for the shape.
- If the rows are empty or misaligned, the holtankoljak.hu selectors in `server/tests/getFuelPrice.ts` have probably changed. Report it; don't paper over it.

## 3b. Start the Firebase emulators (background)
- Accounts and saved cars run against the local emulators, never production: `npm run emulators` with `run_in_background`.
- Ready when the output shows the table with Authentication 127.0.0.1:9099 and Firestore 127.0.0.1:8080. Needs Java (OpenJDK 21 was installed with winget on 2026-10-24).
- Data lives in memory: restarting the emulators wipes test accounts and cars. The emulator's Google sign-in window lets you "Add new account" with any email.

## 4. Start the frontend (background)
- Point it at the local server and the emulators for this session only, without editing `.env`:
  `$env:REACT_APP_PROD_SERVER_URL='http://localhost:3001'; $env:REACT_APP_FIREBASE_EMULATORS='true'; $env:BROWSER='none'; npm start`
- The Playwright suite reuses this server, so it must be started with both variables, or the account tests fail.
- Run it with `run_in_background`, then wait for "Compiled successfully" (or the warnings output) on http://localhost:3000.
- CRA reads env vars only at startup, so restart the frontend after changing them.

## 5. Smoke test
Run `npm run test:e2e` (Playwright; it reuses the running servers). If an `@maps` test fails with "No Places suggestions", the Maps key is missing or invalid; that's not a code bug. The checks the suite automates:
1. Desktop (≥900px wide), floating-panel layout:
   - Pick `Budapest` as Start and `Debrecen` as Destination from the suggestions.
     - The route appears without pressing a button, fitted next to the panel, with lettered markers (A, B, …).
     - The distance is filled in.
   - Enter a consumption such as `6,5` (a comma decimal must work). Today's average price is already filled in.
   - Add a passenger. The cost card updates live with one-way/round-trip and per-person amounts.
2. Mobile (<900px wide): the route card is pinned on top and the trip details are in the bottom sheet.
   - The cost card stays visible while you scroll the inputs.
   - The location button floats above the sheet.
3. Before filling anything in, the cost card says "Add the distance and consumption to see the cost."
4. Menu (rail on desktop, tab bar on phones): Profile → sign in (emulator window) → Cars → add a car → back on Plan the Car row uses it and the price follows its fuel.
5. Check the console for errors. Ignore Google's DirectionsService deprecation warnings and the known debug `console.log` calls.

## 6. Report and clean up
- Report what worked and what failed, with the exact errors.
- Leave the servers running unless the user asks you to stop them; tell the user they're running and on which ports.
