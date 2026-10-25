import { expect, Locator, Page } from "@playwright/test";

/** The main menu (left rail on desktop, bottom tab bar on phones) and the screens it opens. */
export class MainMenu {
  readonly bar: Locator;
  readonly items: Locator;
  readonly planItem: Locator;
  readonly carsItem: Locator;
  readonly profileItem: Locator;
  readonly carsScreen: Locator;
  readonly profileScreen: Locator;

  constructor(page: Page) {
    const menu = page.getByRole("navigation", { name: "Main" });
    this.bar = menu;
    this.items = menu.getByRole("button");
    this.planItem = menu.getByRole("button", { name: "Plan" });
    this.carsItem = menu.getByRole("button", { name: "Cars" });
    this.profileItem = menu.getByRole("button", { name: "Profile" });
    this.carsScreen = page.getByRole("region", { name: "Cars" });
    this.profileScreen = page.getByRole("region", { name: "Profile" });
  }

  /** How many px of the element's bottom the menu (phone tab bar) covers; 0 when it's fully clear. */
  async pxCovered(element: Locator) {
    const box = (await element.boundingBox())!;
    const menuTop = (await this.bar.boundingBox())!.y;
    return Math.max(0, Math.round(box.y + box.height - menuTop));
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
