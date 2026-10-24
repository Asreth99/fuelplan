import { expect, Locator, Page } from "@playwright/test";

/** The app frame: full-screen map with a floating panel (desktop) or a bottom sheet (mobile). */
export class AppShell {
  readonly toast: Locator;
  // <html>: carries class="dark" or "light" for the colour theme
  readonly document: Locator;
  private readonly sheet: Locator;
  private readonly sheetRoot: Locator;
  private readonly sheetHandle: Locator;

  constructor(private readonly page: Page) {
    this.toast = page.getByRole("status", { name: "Notifications" });
    this.document = page.locator("html");
    this.sheet = page.locator("[data-rsbs-overlay]");
    this.sheetRoot = page.locator("[data-rsbs-root]");
    this.sheetHandle = page.locator("[data-rsbs-header]");
  }

  async open() {
    await this.page.goto("/");
  }

  /** Opens a link that leads into FuelPlan, e.g. the sign-in link from an email. */
  async openLink(url: string) {
    await this.page.goto(url);
  }

  async reload() {
    await this.page.reload();
  }

  /** Pulls a phone dialog sheet down by its top bar (grabber and title) by `distance` px, then lets go. */
  async dragDialogDown(dialog: Locator, distance: number) {
    const handle = (await dialog.getByTestId("dialog-handle").boundingBox())!;
    const x = handle.x + handle.width / 3; // clear of the ✕ on the right
    const y = handle.y + 10;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + distance, { steps: 10 });
    await this.page.mouse.up();
  }

  async pressEscape() {
    await this.page.keyboard.press("Escape");
  }

  /** Cuts (or restores) this browser's network, as when a phone loses signal. */
  async setOffline(offline: boolean) {
    await this.page.context().setOffline(offline);
  }

  /** Makes the trip inputs reachable: on phones the sheet opens small, so drag it up; desktop shows them already. */
  async revealTripInputs() {
    // Decided by width, like the app (its 900px breakpoint): the sheet only appears once Maps has loaded.
    if (this.page.viewportSize()!.width < AppShell.MOBILE_BREAKPOINT) await this.expandBottomSheet();
  }

  private static readonly MOBILE_BREAKPOINT = 900;

  /** Pulls the mobile bottom sheet down by `distance` px and keeps holding it (call `releaseDrag` after). */
  async holdBottomSheetPulledDown(distance: number) {
    await expect(this.sheetRoot).toHaveAttribute("data-rsbs-state", "open");
    const handle = (await this.sheetHandle.boundingBox())!;
    const x = handle.x + handle.width / 2;
    await this.page.mouse.move(x, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(x, handle.y + handle.height / 2 + distance, { steps: 12 });
  }

  async releaseDrag() {
    await this.page.mouse.up();
  }

  /** Drags the mobile bottom sheet all the way up. */
  async expandBottomSheet() {
    await this.dragSheetHandleTo(0);
  }

  /** Drags the mobile bottom sheet down to its smallest (peek) height. */
  async collapseBottomSheet() {
    await this.dragSheetHandleTo(this.page.viewportSize()!.height);
  }

  /** Distance from the top of the screen to the top edge of the bottom sheet, in px. */
  async bottomSheetTop() {
    return (await this.sheet.boundingBox())!.y;
  }

  private async dragSheetHandleTo(y: number) {
    // The sheet ignores drags while it is still sliding in after page load.
    await expect(this.sheetRoot).toHaveAttribute("data-rsbs-state", "open");
    const handle = (await this.sheetHandle.boundingBox())!;
    const x = handle.x + handle.width / 2;
    await this.page.mouse.move(x, handle.y + handle.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y, { steps: 12 });
    await this.page.mouse.up();
    // After a drag the sheet is "dragging"/"snapping"; it is settled once it reports "open" again.
    await expect(this.sheetRoot).toHaveAttribute("data-rsbs-state", "open");
  }
}
