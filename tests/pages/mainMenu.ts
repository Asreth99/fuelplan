import { expect, Locator, Page } from "@playwright/test";

/** The main menu (left rail on desktop, bottom tab bar on phones) and the screens it opens. */
export class MainMenu {
  readonly items: Locator;
  readonly planItem: Locator;
  readonly carsItem: Locator;
  readonly profileItem: Locator;
  readonly carsScreen: Locator;
  readonly profileScreen: Locator;

  constructor(page: Page) {
    const menu = page.getByRole("navigation", { name: "Main" });
    this.items = menu.getByRole("button");
    this.planItem = menu.getByRole("button", { name: "Plan" });
    this.carsItem = menu.getByRole("button", { name: "Cars" });
    this.profileItem = menu.getByRole("button", { name: "Profile" });
    this.carsScreen = page.getByRole("region", { name: "Cars" });
    this.profileScreen = page.getByRole("region", { name: "Profile" });
  }

  /** Whether the menu item is what a tap on its centre would hit (nothing drawn over it). */
  async isOnTop(item: Locator) {
    return item.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return hit !== null && element.contains(hit);
    });
  }

  async openCars() {
    await this.carsItem.click();
    await expect(this.carsScreen).toBeVisible();
  }

  async openProfile() {
    await this.profileItem.click();
    await expect(this.profileScreen).toBeVisible();
  }

  async openPlan() {
    await this.planItem.click();
    await expect(this.planItem).toHaveAttribute("aria-current", "page");
  }
}
