# Profile and sign-in ("Profil")

Status: **built in the app on 2026-10-24**, against the Firebase emulator. **Apple sign-in was removed on 2026-10-25** (it needs a paid Apple Developer account); the Apple parts below are kept for when it comes back. Before launch: Google's official button and the final privacy notice (see CLAUDE.md, known issues).

- Prototype: [prototype/fuelplan.html](../prototype/fuelplan.html). Click **Profil** (desktop: bottom of the rail; phone: last tab), or open Cars while signed out.
- Screenshots: [screenshots/profile/](../screenshots/profile/), plus the signed-out Cars states in [screenshots/cars/](../screenshots/cars/).
- Technical plan: [technical-plans/accounts-and-storage.md](../technical-plans/accounts-and-storage.md).

## Decisions
- Cars are stored **in the cloud, per account** (Firebase), so they're on every device and never lost with the browser.
- **Signing in is required to save cars.** Planning a route and calculating the cost work without an account, exactly as today.
- **Sign-in methods:**
  - Apple;
  - Google;
  - email link (passwordless: we email a link, with no password to remember).

## Navigation
| | Desktop | Phone |
|---|---|---|
| Profile item | Bottom of the rail. A person icon when signed out; the user's **initials** in a lime circle when signed in | Last tab: Plan · Cars · **Profile** |
| Profile view | Floating panel next to the map, like Cars | Full screen above the tab bar |

## Signed out
**Profile** shows the sign-in panel:
- the title "Sign in to FuelPlan", and one sentence on why: your cars go to your account, are on every device, and are never lost;
- **Continue with Apple** (black) and **Continue with Google** (white, outlined);
- an "or by email, no password" divider;
- an email field with **Send sign-in link**;
- the small print: by signing in you accept the privacy notice; no passwords are stored.

The prototype uses plain stand-in buttons. **The app must use Apple's and Google's official branded buttons** (Sign in with Apple guidelines and Google's "Sign in with Google" branding), in the same order and size.

- **Cars, signed out:** the same panel, with the heading "Sign in to save your cars" and a reminder that routes work without signing in.
- **The car picker, signed out:** only **Custom values**, plus a "Sign in and save your cars" link that opens Cars.

### Email link flow
1. Enter the email and press **Send sign-in link**. An invalid address gets an inline error: "Enter a valid email address."
2. "**Check your inbox**": "We sent a sign-in link to <b>anna@…</b>. Open it on this device and you're in."
   - **Resend** stays disabled for 30 s, showing a countdown.
   - **Use a different email** goes back.
3. Opening the link signs the user in and returns them to where they were.
   - If the link is opened on **another device**, the app asks for the email once more. This is a Firebase security rule that stops a forwarded link signing someone else in.
   - **Expired or already-used link:** "This link has expired. We can send a new one." with a button.

## Signed in
1. **Account card** (dark green): the initials avatar, name (or email when there's no name), email, and a provider pill (Google account / Apple ID / Email link).
   - Apple users may hide their address; the card then shows Apple's private relay address, which is expected.
2. **Sync status** (a live line):
   - ✓ "Synced: your cars are on all your devices";
   - offline: "You're offline. Changes are saved as soon as you're back online." Edits keep working offline.
3. **Rows:**
   - **My cars** (count) ›;
   - **Privacy notice** ›;
   - **Sign out**.
4. **Danger zone:** **Delete account** ("Permanently deletes your account and all your saved cars").

**Signing out:**
- The trip keeps the values of the car in use as **Custom**, so the cost doesn't jump.
- The cloud cars disappear from this device: the local copy is cleared, which matters on shared computers.
- Signing in again on any device brings them back.

### Deleting the account
A dialog (sheet on phones):
- "We'll permanently delete your account (**email**) and your saved cars (**3**). This can't be undone."
- A note: for security, we first confirm it's you, the same way you sign in (re-authentication).
- An **"I understand that deletion is final"** checkbox. Until it's ticked, the red **Delete account permanently** button stays disabled.
- After deletion: signed out, with the toast "Your account and data were deleted".

This is required for GDPR (right to erasure), and Apple requires it for any app that offers Sign in with Apple.

## Errors and edge cases
| Situation | What the user sees |
|---|---|
| Sign-in popup blocked by the browser | "Your browser blocked the sign-in window. Allow pop-ups for FuelPlan and try again." |
| The user closes the Apple/Google window | Nothing: back to the panel, with no error |
| Email already used with another method (e.g. Google, then Apple with the same email) | "This email already belongs to an account that uses Google. Continue with Google to sign in." After that, the second method is linked to the same account |
| No network while signing in | "No internet connection. Try again when you're online." |
| Session expired on a long-unused device | Signed out quietly; Cars shows the sign-in panel again |

## Mock labels → English app labels
| Mock (HU) | App (EN) |
|---|---|
| Profil | Profile |
| Lépj be a FuelPlanbe | Sign in to FuelPlan |
| Jelentkezz be az autóid mentéséhez | Sign in to save your cars |
| Folytatás Apple-lel / Google-fiókkal | Continue with Apple / Google |
| vagy e-mailben, jelszó nélkül | or by email, no password |
| Belépési link küldése | Send sign-in link |
| Nézd meg a postafiókodat | Check your inbox |
| Újraküldés (30 mp) · Másik e-mail-cím | Resend (30 s) · Use a different email |
| Szinkronizálva: az autóid minden eszközödön elérhetők. | Synced: your cars are on all your devices. |
| Autóim · Adatkezelési tájékoztató · Kijelentkezés | My cars · Privacy notice · Sign out |
| Fiók törlése · Értem, hogy a törlés végleges. · Fiók végleges törlése | Delete account · I understand that deletion is final. · Delete account permanently |
| Bejelentkeztél / Kijelentkeztél | Signed in / Signed out |
