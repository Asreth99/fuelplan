import { Locator, Page } from "@playwright/test";

/** The Google map with its "Find my location" control. */
export class MapView {
  readonly locateButton: Locator;
  readonly myLocationMarker: Locator;
  readonly locationAlert: Locator;
  readonly mapTypeSwitcher: Locator;
  readonly infoCards: Locator;
  private readonly map: Locator;
  private readonly bottomSheet: Locator;
  private readonly routeCard: Locator;
  private readonly openInGoogleMapsLink: Locator;

  constructor(private readonly page: Page) {
    this.locateButton = page.getByRole("button", { name: "Find my location" });
    this.myLocationMarker = page.getByTitle("Your location");
    this.locationAlert = page.getByText("Location unavailable");
    this.mapTypeSwitcher = page.locator(".gm-style-mtc");
    this.infoCards = page.locator(".gm-style-iw");
    this.map = page.locator(".map-container");
    this.bottomSheet = page.locator("[data-rsbs-overlay]");
    this.routeCard = page.getByRole("form", { name: "Route" });
    this.openInGoogleMapsLink = page.getByRole("link", { name: /Open this area in Google Maps/ });
  }

  /** Taps the map at an offset (px) from its centre, then gives Google time to react. */
  async tapMap(offsetFromCentre: { x: number; y: number }) {
    const map = (await this.map.boundingBox())!;
    await this.page.mouse.click(map.x + map.width / 2 + offsetFromCentre.x, map.y + map.height / 2 + offsetFromCentre.y);
    // Google opens a place card only after fetching the place's details, so "nothing opened"
    // can only be checked after waiting.
    await this.page.waitForTimeout(2_000);
  }

  /**
   * On a touch screen: double-tap the visible part of the map, keep the finger down and
   * slide it by `slidePx` (positive = down) before lifting it. 0 = a plain double-tap.
   */
  async doubleTapAndSlide(slidePx: number) {
    const { x, y } = await this.visibleMapSpot();
    await this.touch([{ x, y }, null], [...this.slide({ x, y }, 0, slidePx), null]);
  }

  /** On a touch screen: drag the map with one finger by `dragPx` horizontally. */
  async dragWithOneFinger(dragPx: number) {
    const { x, y } = await this.visibleMapSpot();
    await this.touch([...this.slide({ x, y }, dragPx, 0), null]);
  }

  /** The middle of the map strip left visible between the route card and the bottom sheet. */
  private async visibleMapSpot() {
    const card = (await this.routeCard.boundingBox())!;
    const sheet = (await this.bottomSheet.boundingBox())!;
    return { x: card.x + card.width / 2, y: (card.y + card.height + sheet.y) / 2 };
  }

  /** Finger positions from `from`, moving by (dx, dy) in 10 steps. */
  private slide(from: { x: number; y: number }, dx: number, dy: number) {
    return Array.from({ length: 11 }, (_, step) => ({ x: from.x + (dx * step) / 10, y: from.y + (dy * step) / 10 }));
  }

  /**
   * Plays one finger's touches. In each path the first point touches down, the next ones move
   * and `null` lifts the finger. Playwright's touchscreen only taps; a held, moving finger needs
   * Chrome's input protocol.
   */
  private async touch(...paths: ({ x: number; y: number } | null)[][]) {
    const cdp = await this.page.context().newCDPSession(this.page);
    for (const [pathIndex, path] of paths.entries()) {
      // A human-like pause between taps (the app counts taps up to 300 ms apart as a double-tap).
      if (pathIndex > 0) await this.page.waitForTimeout(80);
      for (const [index, point] of path.entries()) {
        const type = point === null ? "touchEnd" : index === 0 ? "touchStart" : "touchMove";
        await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: point ? [point] : [] });
      }
    }
    await cdp.detach();
  }

  /** The map's current zoom level (15 = streets, 7 = whole country), read from Google's own link. */
  async zoomLevel() {
    const href = (await this.openInGoogleMapsLink.getAttribute("href"))!;
    return Number(new URL(href).searchParams.get("z"));
  }

  /** On mobile: the height of the map strip left visible between the route card and the bottom sheet, in px. */
  async visibleMapHeight() {
    const card = (await this.routeCard.boundingBox())!;
    const sheet = (await this.bottomSheet.boundingBox())!;
    return sheet.y - (card.y + card.height);
  }

  /** Where the locate button sits on mobile, in px: its edges and its gaps to the route card and the sheet. */
  async locateButtonPlacement() {
    const button = (await this.locateButton.boundingBox())!;
    const sheet = (await this.bottomSheet.boundingBox())!;
    const card = (await this.routeCard.boundingBox())!;
    return {
      top: button.y,
      bottom: button.y + button.height,
      gapBelowRouteCard: button.y - (card.y + card.height),
      gapAboveSheet: sheet.y - (button.y + button.height),
    };
  }
}
