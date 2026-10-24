import { expect, Locator, Page } from "@playwright/test";
import { Route } from "../data/trips";

/** The route card: start, stops and destination with Google Places autocomplete, and the route on the map. */
export class RouteSearchPanel {
  readonly start: Locator;
  readonly destination: Locator;
  readonly placeFields: Locator;
  readonly addStopButton: Locator;
  readonly removeButtons: Locator;
  readonly routeSummary: Locator;
  readonly routeError: Locator;
  readonly routeMarkers: Locator;
  private readonly firstSuggestion: Locator;

  constructor(private readonly page: Page) {
    const card = page.getByRole("form", { name: "Route" });
    this.start = this.field("Start");
    this.destination = this.field("Destination");
    this.placeFields = card.getByRole("textbox");
    this.addStopButton = card.getByRole("button", { name: "Add stop" });
    this.removeButtons = card.getByRole("button", { name: /^Remove / });
    this.routeSummary = page.getByRole("group", { name: "Route summary" });
    this.routeError = page.getByRole("alert").filter({ hasText: "No route found" });
    // The map's lettered stop markers are titled "A: <address>", "B: <address>", …
    this.routeMarkers = page.getByTitle(/^[A-Z]: /);
    // Each place field has its own suggestion list; only the open one is visible.
    this.firstSuggestion = page.locator(".pac-container:visible .pac-item").first();
  }

  /** A place field by its label: "Start", "Stop 1", "Stop 2", …, "Destination". */
  field(label: string) {
    return this.page.getByRole("textbox", { name: label, exact: true });
  }

  /** The map marker of the given letter (A = start), e.g. to check which address it marks. */
  routeMarker(letter: string) {
    return this.page.getByTitle(new RegExp(`^${letter}: `));
  }

  /** Picking both places from the suggestions starts the search; there is no Search button. */
  async searchRoute(route: Route) {
    await this.pickPlace(this.start, route.from);
    await this.pickPlace(this.destination, route.to);
  }

  /** Adds a stop before the destination and picks its place from the suggestions. */
  async addStop(place: string) {
    const fieldsBefore = await this.placeFields.count();
    await this.addStopButton.click();
    await this.pickPlace(this.field(`Stop ${fieldsBefore - 1}`), place);
  }

  async removeStop(label: string) {
    await this.page.getByRole("button", { name: `Remove ${label}`, exact: true }).click();
  }

  /** Drags a place by its handle onto the position of another one. */
  async moveStop(label: string, ontoLabel: string) {
    const from = (await this.reorderHandle(label).boundingBox())!;
    const onto = (await this.reorderHandle(ontoLabel).boundingBox())!;
    const x = from.x + from.width / 2;
    await this.page.mouse.move(x, from.y + from.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(x, onto.y + onto.height / 2, { steps: 10 });
    await this.page.mouse.up();
  }

  async pickPlace(input: Locator, place: string) {
    await input.fill(place);
    await expect(
      this.firstSuggestion,
      "No Places suggestions - is REACT_APP_GOOGLE_MAPS_API_KEY set in .env?"
    ).toBeVisible({ timeout: 10_000 });
    await this.firstSuggestion.click();
  }

  private reorderHandle(label: string) {
    return this.page.getByRole("button", { name: `Reorder ${label}`, exact: true });
  }
}
