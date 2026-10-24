# Accounts and cloud storage: technical plan

Status: **implemented on 2026-10-24** (code paths in CLAUDE.md; `useCars` became `useCars.tsx`, `useAuth` became `useAuth.tsx`). The console setup below is still to do. Covers: [Profile](../screen-specs/profile.md) and [Saved cars](../screen-specs/cars.md).

## Decision
- **Firebase Authentication** (Apple, Google, email link) plus **Cloud Firestore**, used directly from the React app with the modular Web SDK. `firebase` v12 is already in `package.json`, unused.
- **No server changes.** The Cloud Run price server stays a stateless scraper.
- **Same Firebase project as Hosting:** `fuelplan-fbaca`.
- **Signing in is required to save cars.** The calculator never depends on an account.

Why not the other options: `localStorage` only would mean a painful migration later, and loses data with the browser (Safari deletes site storage after 7 days without a visit). An own backend means building accounts, a database and an API, all of which Firebase already provides.

## Firebase setup (console, one-off)
1. **Firestore:** create the database in an **EU location**, e.g. `eur3` or `europe-central2` (Warsaw). ⚠ The location **can't be changed later**. EU keeps it GDPR-friendly and close to Hungarian users.
2. **Authentication → Sign-in method:**
   - **Google:** enable it. Nothing else is needed.
   - **Email link:** enable *Email/Password* with **Email link (passwordless sign-in)**.
   - **Apple:**
     - needs an **Apple Developer Program** membership (paid, yearly);
     - in Apple's portal: an App ID with *Sign in with Apple*, a **Services ID**, and a **private key** (`.p8`);
     - register the domain and the return URL `https://<authDomain>/__/auth/handler`;
     - in Firebase: Services ID, Team ID, Key ID and the key.
3. **Authorized domains:** `localhost`, the Hosting domains and any custom domain.
   - Phone testing through a Cloudflare tunnel needs that tunnel domain added each time, because its random name changes.
   - Better: use **Firebase Hosting preview channels** (`firebase hosting:channel:deploy`), which give stable HTTPS URLs for testing on a phone.
4. **App Check** with reCAPTCHA Enterprise, for Firestore and Auth. Monitor first, enforce once the numbers look right.
5. **Web API key:** restrict it to FuelPlan's domains in Google Cloud Console. The Firebase web config isn't a secret; protection comes from the rules and App Check.

## Sign-in details
- **Popup, not redirect** (`signInWithPopup`). Redirect sign-in breaks in browsers that block third-party storage (Safari, and Chrome increasingly), unless `authDomain` is the app's own domain.
  - So set **`authDomain` to the Hosting domain** (or the custom domain), so that `/__/auth/handler` is same-origin. This also covers popups on iOS.
- **Email link:**
  - `sendSignInLinkToEmail(auth, email, { url: "<app>/finish-sign-in", handleCodeInApp: true })`;
  - store the email in `localStorage` under `fuelplan.emailForSignIn`;
  - on return: `isSignInWithEmailLink` → `signInWithEmailLink`;
  - if the email isn't stored (another device), ask for it.
  - ⚠ *Verify when building:* the web flow should no longer need Firebase Dynamic Links (shut down in 2025). Check the current Firebase docs before implementing.
- **One account per email** (Firebase's default). Signing in with a second provider for the same email gives `auth/account-exists-with-different-credential`. Then:
  - look up the existing method;
  - ask the user to sign in with it;
  - `linkWithCredential` the new provider.

  Google is a "trusted" provider for its own emails, so some of these cases resolve automatically. Test each pair of providers.
- **Apple** sends the user's name **only on the first sign-in**. We don't need the name (the profile shows initials or the email), so nothing has to be stored.
- **Session:** `browserLocalPersistence` (the default), so users stay signed in.

## Data model
```
users/{uid}                 { defaultCarId: string | null, createdAt: Timestamp }
users/{uid}/cars/{carId}    { name: string, fuel: "petrol95" | "diesel", consumption: number,
                              color: "#rrggbb", createdAt: Timestamp, updatedAt: Timestamp }
```
- **No personal data is copied into Firestore.** Name, email and photo stay in Firebase Auth (data minimisation).
- **`defaultCarId` lives on the user document.** That makes "exactly one default" automatic: one field, one write, instead of keeping `isDefault` flags on every car in sync.
- **Car ids:** Firestore auto-ids (`doc(collection(db, "users", uid, "cars"))`). Random by design, which is the stop-id lesson.
- **Size:** tiny, a few hundred bytes per car. The UI can cap it at 20 cars per user; the rules can't count cheaply.

## Security rules (`firestore.rules`)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    function validCar(car) {
      return car.keys().hasOnly(['name', 'fuel', 'consumption', 'color', 'createdAt', 'updatedAt'])
        && car.name is string && car.name.size() > 0 && car.name.size() <= 30
        && car.fuel in ['petrol95', 'diesel']
        && car.consumption is number && car.consumption >= 1 && car.consumption <= 40
        && car.color is string && car.color.matches('^#[0-9a-fA-F]{6}$')
        && car.createdAt is timestamp && car.updatedAt is timestamp;
    }

    match /users/{uid} {
      allow read, delete: if isOwner(uid);
      allow create, update: if isOwner(uid)
        && request.resource.data.keys().hasOnly(['defaultCarId', 'createdAt'])
        && (request.resource.data.defaultCarId == null || request.resource.data.defaultCarId is string);

      match /cars/{carId} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid) && validCar(request.resource.data);
      }
    }
  }
}
```
- **Everything else is denied by default.**
- The client validation (name required, consumption 1–40) mirrors these rules, so users see friendly errors instead of permission errors.
- The existing `storage.rules` (deny all) stays as it is; Cloud Storage isn't used.

## Offline and sync
- **Persistent local cache:**
  ```ts
  initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  ```
  This is an IndexedDB cache. The UI is instant, works offline, queues writes and syncs them when back online, and multiple tabs share it.
- **Live list:** `onSnapshot(collection(db, "users", uid, "cars"))`. A change on the phone appears on the desktop within a second.
- **Sync status in Profile:** comes from snapshot metadata (`fromCache`, `hasPendingWrites`) and the browser's `online`/`offline` events.
- **Sign out:** `signOut`, then `terminate(db)` and `clearIndexedDbPersistence(db)`, then re-initialise. This removes the cached cars from shared computers.

## Account deletion
1. **Re-authenticate** with the same method (popup, or a fresh email link). `deleteUser` fails with `auth/requires-recent-login` otherwise.
2. **Delete the data:** all `users/{uid}/cars/*` and `users/{uid}`, in one batched write.
3. **`deleteUser(user)`.**
4. **Apple users:** also revoke the Apple token, which Apple requires. ⚠ *Verify when building:* the Firebase Web SDK's `revokeAccessToken` and the exact flow for web.

The client-side deletion works on the free Spark plan. A more robust option, which also cleans up if the client crashes halfway, is a Cloud Function on user deletion (the "Delete User Data" extension). That needs the Blaze (pay-as-you-go) plan.

## Data access requests (no "Download my data" button)
The profile has no export button; it was removed by decision on 2026-10-24. Users still have the GDPR rights to **access** and **portability**, so the privacy notice must give a contact (e.g. an email address) for requests. To answer one, the cars can be read from Firestore in the Firebase console, or with a small admin script, and sent within the legal deadline (one month).

## Cost
- **Spark (free) plan:** Firestore allows 50k reads, 20k writes and 1 GiB per day, orders of magnitude more than FuelPlan needs.
- **Auth:** Google, Apple and email link are free.
- **Blaze** is only needed for Cloud Functions or extensions.
- **The Apple Developer membership** is the only fixed cost.

## Code structure (when coding is allowed)
```
src/firebase/firebase.ts     initializeApp, getAuth, initializeFirestore (config from REACT_APP_FIREBASE_*)
src/auth/useAuth.ts          user, signInWith(provider), sendEmailLink, finishEmailLink, signOut, deleteAccount
src/cars/carRepository.ts    Firestore reads/writes; validation shared with the rules
src/cars/useCars.ts          live cars, defaultCarId, add / update / remove / setDefault, sync status
src/navigation/              NavRail (desktop), TabBar (phone)
src/profile/, src/cars/      ProfileView, SignInPanel, CarsView, CarEditor, CarPicker (each with a .css)
```
- **Config:** `REACT_APP_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_APP_ID` in `.env` and in the GitHub Action's variables. (`src/firebaseConfig.ts` is already gitignored, a leftover from an earlier attempt; the env vars replace it.)
- **The trip calculator only consumes "the selected car"** (consumption, fuel). Without an account it uses custom values, exactly as today.

## Testing
- **Firebase Local Emulator Suite** (Auth + Firestore): `firebase emulators:start`, configured in `firebase.json`. The Playwright suite and local development run against it, **never against production**.
  - The emulator's Auth offers a fake provider sign-in page, so Google and Apple flows can be clicked through in tests.
  - Email-link codes can be read from the emulator's REST endpoint (`/emulator/v1/projects/<id>/oobCodes`), so a test can "open the link".
- **Rules unit tests** with `@firebase/rules-unit-testing`:
  - owner-only access;
  - field validation;
  - no access to other users' cars.
- **Playwright specs (per `/write-tests`):**
  - the sign-in gate;
  - each provider via the emulator;
  - the email-link flow;
  - cars syncing between two browser contexts (simulating two devices);
  - offline edits syncing later;
  - sign-out clearing cars;
  - account deletion.

## Deploy
- `firebase.json`: add `firestore: { rules, indexes }` and the emulators section.
- **The GitHub Action** also deploys `firestore.rules`. Its service account then needs the *Firebase Rules Admin* role.
- **Before launch:** a privacy notice (in Hungarian) describing what's stored, where (EU), and how to export or delete it.

## Open questions
- **Apple Developer account:** who owns it, and when? Sign in with Apple can't be tested without it.
- **Custom domain:** a custom domain changes `authDomain` and the Apple configuration. Decide before setting up Apple.
- **Privacy notice text:** owner and wording.
