import { expect, Locator, Page } from "@playwright/test";
import { Account } from "../data/accounts";
import { SignInPanel } from "./signInPanel";

/** Profile while signed in: account card, sync status, sign out and delete account. */
export class ProfilePage {
  readonly accountCard: Locator;
  readonly syncStatus: Locator;
  readonly myCarsRow: Locator;
  readonly signOutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly deleteDialog: Locator;
  readonly understandCheckbox: Locator;
  readonly deletePermanentlyButton: Locator;

  constructor(private readonly page: Page) {
    this.accountCard = page.getByRole("region", { name: "Account", exact: true });
    this.syncStatus = page.getByRole("region", { name: "Profile" }).getByRole("status");
    this.myCarsRow = page.getByRole("button", { name: /^My cars/ });
    this.signOutButton = page.getByRole("button", { name: "Sign out" });
    this.deleteAccountButton = page.getByRole("button", { name: "Delete account", exact: true });
    this.deleteDialog = page.getByRole("dialog", { name: "Delete account?" });
    this.understandCheckbox = this.deleteDialog.getByRole("checkbox", { name: "I understand that deletion is final." });
    this.deletePermanentlyButton = this.deleteDialog.getByRole("button", { name: "Delete account permanently" });
  }

  /** The Appearance switch: "System", "Light" or "Dark" (on Profile, signed in or not). */
  appearanceOption(name: "System" | "Light" | "Dark") {
    return this.page.getByRole("group", { name: "Appearance" }).getByRole("button", { name });
  }

  async signOut() {
    await this.signOutButton.click();
    await expect(this.signOutButton).toBeHidden();
  }

  async openDeleteDialog() {
    await this.deleteAccountButton.click();
    await expect(this.understandCheckbox).toBeFocused();
  }

  /** Confirms the deletion; Google accounts first confirm it's them in the sign-in window. */
  async confirmDeletion(account: Account) {
    await this.understandCheckbox.check();
    if (account.provider === "email") {
      await this.deletePermanentlyButton.click();
    } else {
      const [popup] = await Promise.all([this.page.waitForEvent("popup"), this.deletePermanentlyButton.click()]);
      await SignInPanel.completeProviderWindow(popup, account);
    }
    await expect(this.deleteDialog).toBeHidden();
  }
}
