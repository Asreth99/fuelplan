import { expect, Locator, Page } from "@playwright/test";
import { Account } from "../data/accounts";

/** Sign-in panel (Profile and Cars while signed out), including the emulator's Google window. */
export class SignInPanel {
  readonly heading: Locator;
  // Apple sign-in was removed; kept only to check that it stays gone.
  readonly appleButton: Locator;
  readonly googleButton: Locator;
  readonly emailField: Locator;
  readonly sendLinkButton: Locator;
  readonly emailError: Locator;
  readonly checkInboxHeading: Locator;
  readonly resendButton: Locator;
  readonly useDifferentEmailButton: Locator;
  readonly confirmEmailHeading: Locator;
  readonly finishSignInButton: Locator;
  readonly expiredLinkMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: /^Sign in to/ });
    this.appleButton = page.getByRole("button", { name: "Continue with Apple" });
    this.googleButton = page.getByRole("button", { name: "Sign in with Google" });
    this.emailField = page.getByRole("textbox", { name: "Email" });
    this.sendLinkButton = page.getByRole("button", { name: "Send sign-in link" });
    this.emailError = page.getByText("Enter a valid email address.");
    this.checkInboxHeading = page.getByRole("heading", { name: "Check your inbox" });
    this.resendButton = page.getByRole("button", { name: /^Resend/ });
    this.useDifferentEmailButton = page.getByRole("button", { name: "Use a different email" });
    this.confirmEmailHeading = page.getByRole("heading", { name: "Confirm your email" });
    this.finishSignInButton = page.getByRole("button", { name: "Sign in", exact: true });
    this.expiredLinkMessage = page.getByText("This link has expired. We can send a new one");
  }

  /** Signs in with Google through the emulator's sign-in window, creating the account if needed. */
  async signInWithGoogle(account: Account) {
    const [popup] = await Promise.all([this.page.waitForEvent("popup"), this.googleButton.click()]);
    await SignInPanel.completeProviderWindow(popup, account);
  }

  async requestEmailLink(email: string) {
    await this.emailField.fill(email);
    await this.sendLinkButton.click();
  }

  /**
   * The emulator's stand-in for Google's sign-in window: an existing test account is
   * picked from its list, a new one is added. Also used when deleting an account (re-authentication).
   */
  static async completeProviderWindow(popup: Page, account: Account) {
    const existing = popup.getByText(account.email);
    const addNew = popup.getByText("Add new account");
    const emailInput = popup.locator("#email-input");
    await popup.waitForLoadState();
    await expect(existing.or(addNew).first()).toBeVisible();
    let finalClick = existing;
    if (!(await existing.isVisible())) {
      // The window's script may still be starting: a click before that does nothing, so try again.
      await expect(async () => {
        await addNew.click();
        await expect(emailInput).toBeVisible({ timeout: 1_000 });
      }).toPass();
      await emailInput.fill(account.email);
      await popup.locator("#display-name-input").fill(account.name ?? "");
      finalClick = popup.getByRole("button", { name: /^Sign in with/ });
    }
    // The window closes itself once the app has the sign-in. It reports back through Firebase's
    // relay iframe in the app, which downloads Google's gapi script from apis.google.com, also
    // with the emulators. If that download failed, the window stays open forever.
    const closed = popup.waitForEvent("close", { timeout: 15_000 }).catch(() => {
      throw new Error(
        "The emulator's Google sign-in window didn't close. Usually Firebase's sign-in relay couldn't " +
          "download https://apis.google.com/js/api.js (a network problem, not an app bug): check the trace's network tab."
      );
    });
    await finalClick.click();
    await closed;
  }
}
