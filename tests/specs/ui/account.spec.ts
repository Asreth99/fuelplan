import { test, expect } from "../../fixtures";
import { EMAIL_ACCOUNT, GOOGLE_ACCOUNT, INVALID_EMAIL } from "../../data/accounts";
import { GOLF } from "../../data/cars";

test.describe("Account and sign-in (Firebase emulator)", () => {
  test.beforeEach(async ({ app, emulator, menu }) => {
    await test.step("Start with no test accounts and no saved cars in the local Firebase emulator", async () => {
      await emulator.reset();
    });

    await test.step("Open FuelPlan and go to Profile in the menu", async () => {
      await app.open();
      await menu.openProfile();
    });
  });

  test("signed out, Profile offers Google and an email link", async ({ signIn, menu }) => {
    await test.step("Expect the 'Sign in to FuelPlan' panel", async () => {
      await expect(signIn.heading).toHaveText("Sign in to FuelPlan");
    });

    await test.step("Expect 'Sign in with Google' and an email field with 'Send sign-in link'", async () => {
      await expect(signIn.googleButton).toBeVisible();
      await expect(signIn.emailField).toBeVisible();
      await expect(signIn.sendLinkButton).toBeVisible();
    });

    await test.step("Expect no 'Continue with Apple' (it needs an Apple Developer account)", async () => {
      await expect(signIn.appleButton).toHaveCount(0);
    });

    await test.step("Expect the menu's Profile item to show a person icon, not initials", async () => {
      await expect(menu.profileItem).toHaveText("Profile");
    });
  });

  test("signs in with Google and out again", async ({ signIn, profile, menu, app }) => {
    const account = GOOGLE_ACCOUNT;

    await test.step(`Press 'Sign in with Google' and pick ${account.email} in the sign-in window`, async () => {
      await signIn.signInWithGoogle(account);
    });

    await test.step(`Expect the account card to show ${account.name}, ${account.email} and '${account.methodLabel}'`, async () => {
      await expect(profile.accountCard).toContainText(account.name!);
      await expect(profile.accountCard).toContainText(account.email);
      await expect(profile.accountCard).toContainText(account.methodLabel);
    });

    await test.step(`Expect the menu to show the initials ${account.initials} on Profile`, async () => {
      await expect(menu.profileItem).toHaveText(`${account.initials}Profile`);
    });

    await test.step("Expect the sync line to say the cars are on all devices", async () => {
      await expect(profile.syncStatus).toHaveText("Synced: your cars are on all your devices.");
    });

    await test.step("Press 'Sign out'", async () => {
      await profile.signOut();
    });

    await test.step("Expect the sign-in panel again and a 'Signed out' notice", async () => {
      await expect(signIn.heading).toBeVisible();
      await expect(app.toast).toHaveText("Signed out");
    });
  });

  test("an invalid email address is caught before sending", async ({ signIn }) => {
    await test.step(`Type '${INVALID_EMAIL}' and press 'Send sign-in link'`, async () => {
      await signIn.requestEmailLink(INVALID_EMAIL);
    });

    await test.step("Expect 'Enter a valid email address.' and no 'Check your inbox' step", async () => {
      await expect(signIn.emailError).toBeVisible();
      await expect(signIn.checkInboxHeading).toBeHidden();
    });
  });

  test("signs in with an email link opened on the same device", async ({ signIn, emulator, app, page, profile }) => {
    await test.step(`Ask for a sign-in link for ${EMAIL_ACCOUNT.email}`, async () => {
      await signIn.requestEmailLink(EMAIL_ACCOUNT.email);
    });

    await test.step("Expect 'Check your inbox', with Resend locked for 30 seconds", async () => {
      await expect(signIn.checkInboxHeading).toBeVisible();
      await expect(signIn.resendButton).toBeDisabled();
      await expect(signIn.resendButton).toHaveText(/Resend \(\d+ s\)/);
    });

    const link = await test.step("Take the link from the emulator's outbox", () =>
      emulator.latestSignInLink(EMAIL_ACCOUNT.email)
    );

    await test.step("Open the link in the same browser", async () => {
      await app.openLink(link);
    });

    await test.step(`Expect to be signed in on Profile as ${EMAIL_ACCOUNT.email}, via 'Email link'`, async () => {
      await expect(profile.accountCard).toContainText(EMAIL_ACCOUNT.email);
      await expect(profile.accountCard).toContainText(EMAIL_ACCOUNT.methodLabel);
    });

    await test.step("Expect the one-time code to be gone from the address bar", async () => {
      await expect(page).not.toHaveURL(/oobCode/);
    });
  });

  test("an email link opened on another device asks for the email once more", async ({ signIn, emulator, otherDevice }) => {
    await test.step(`Ask for a sign-in link for ${EMAIL_ACCOUNT.email} on this device`, async () => {
      await signIn.requestEmailLink(EMAIL_ACCOUNT.email);
      await expect(signIn.checkInboxHeading).toBeVisible();
    });

    const link = await test.step("Take the link from the emulator's outbox", () =>
      emulator.latestSignInLink(EMAIL_ACCOUNT.email)
    );

    await test.step("Open the link on another device (a separate browser)", async () => {
      await otherDevice.app.openLink(link);
    });

    await test.step("Expect 'Confirm your email' there instead of signing in straight away", async () => {
      await expect(otherDevice.signIn.confirmEmailHeading).toBeVisible();
    });

    await test.step(`Enter ${EMAIL_ACCOUNT.email} and press 'Sign in'`, async () => {
      await otherDevice.signIn.emailField.fill(EMAIL_ACCOUNT.email);
      await otherDevice.signIn.finishSignInButton.click();
    });

    await test.step("Expect the other device to be signed in with the email link", async () => {
      await expect(otherDevice.profile.accountCard).toContainText(EMAIL_ACCOUNT.email);
    });
  });

  test("a used sign-in link is refused with a clear message", async ({ signIn, emulator, app, profile }) => {
    const link = await test.step(`Ask for a sign-in link for ${EMAIL_ACCOUNT.email} and take it from the outbox`, async () => {
      await signIn.requestEmailLink(EMAIL_ACCOUNT.email);
      await expect(signIn.checkInboxHeading).toBeVisible();
      return emulator.latestSignInLink(EMAIL_ACCOUNT.email);
    });

    await test.step("Open the link and sign out again", async () => {
      await app.openLink(link);
      await profile.signOut();
    });

    await test.step("Open the same link a second time and confirm the email when asked", async () => {
      await app.openLink(link);
      await signIn.emailField.fill(EMAIL_ACCOUNT.email);
      await signIn.finishSignInButton.click();
    });

    await test.step("Expect 'This link has expired. We can send a new one' and the sign-in options", async () => {
      await expect(signIn.expiredLinkMessage).toBeVisible();
      await expect(signIn.sendLinkButton).toBeVisible();
    });
  });

  test("deleting the account removes it and its cars for good", async ({ signIn, profile, menu, cars, app }) => {
    await test.step(`Sign in with Google as ${GOOGLE_ACCOUNT.email} and save ${GOLF.name}`, async () => {
      await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
      await menu.openCars();
      await cars.addCar(GOLF);
      await menu.openProfile();
    });

    await test.step("Press 'Delete account'", async () => {
      await profile.openDeleteDialog();
    });

    await test.step("Expect the dialog to name the email and 1 saved car, and the final button to be disabled until 'I understand' is ticked", async () => {
      await expect(profile.deleteDialog).toContainText(GOOGLE_ACCOUNT.email);
      await expect(profile.deleteDialog).toContainText("your saved cars (1)");
      await expect(profile.deletePermanentlyButton).toBeDisabled();
    });

    await test.step("Tick 'I understand that deletion is final', press 'Delete account permanently' and confirm it's me in the Google window", async () => {
      await profile.confirmDeletion(GOOGLE_ACCOUNT);
    });

    await test.step("Expect to be signed out with 'Your account and data were deleted'", async () => {
      await expect(signIn.heading).toBeVisible();
      await expect(app.toast).toHaveText("Your account and data were deleted");
    });

    await test.step("Sign in with the same Google account again", async () => {
      await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
    });

    await test.step("Expect a fresh account with no saved cars", async () => {
      await expect(profile.myCarsRow).toContainText("0 cars");
    });
  });
});
