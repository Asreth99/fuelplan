import { expect, Locator, Page } from "@playwright/test";
import { FuelType } from "../data/fuelTypes";
import { Trip } from "../data/trips";

/** Trip details: distance, car (picker), consumption, fuel, passengers, and the live fuel cost card. */
export class TripPanel {
  readonly distance: Locator;
  readonly consumption: Locator;
  readonly price: Locator;
  readonly refreshPriceButton: Locator;
  readonly morePassengersButton: Locator;
  readonly roundTripButton: Locator;
  readonly totalCost: Locator;
  readonly costPerPerson: Locator;
  readonly costHint: Locator;
  readonly costCard: Locator;
  readonly routeOptions: Locator;
  readonly carRow: Locator;
  readonly selectedCar: Locator;
  readonly fuelTypeButtons: Locator;
  readonly carPicker: Locator;
  readonly carOptions: Locator;
  readonly newCarLink: Locator;
  readonly manageCarsLink: Locator;
  readonly signInToSaveCarsLink: Locator;

  constructor(private readonly page: Page) {
    this.costCard = page.getByRole("group", { name: "Fuel cost" });
    // One button per route Google offers ("2 h 15 min · 231 km"); the chosen one is pressed.
    this.routeOptions = page.getByRole("group", { name: "Route options" }).getByRole("button");
    this.carRow = page.getByRole("button", { name: /^Car / });
    this.selectedCar = page.getByTestId("selected-car");
    this.fuelTypeButtons = page.getByRole("group", { name: "Fuel type" });
    this.carPicker = page.getByRole("dialog", { name: "Which car are you taking?" });
    this.carOptions = this.carPicker.getByRole("radio");
    this.newCarLink = this.carPicker.getByRole("button", { name: "New car" });
    this.manageCarsLink = this.carPicker.getByRole("button", { name: "Manage cars" });
    this.signInToSaveCarsLink = this.carPicker.getByRole("button", { name: "Sign in and save your cars" });
    this.distance = page.getByRole("textbox", { name: "Distance" });
    this.consumption = page.getByRole("textbox", { name: "Consumption" });
    this.price = page.getByRole("textbox", { name: "Fuel price" });
    this.refreshPriceButton = page.getByRole("button", { name: "Refresh fuel price" });
    this.morePassengersButton = page.getByRole("button", { name: "More passengers" });
    this.roundTripButton = page.getByRole("button", { name: "Round trip" });
    this.totalCost = page.getByTestId("total-cost");
    this.costPerPerson = page.getByTestId("cost-per-person");
    this.costHint = page.getByText(/to see the cost/);
  }

  /** Types numbers the way a Hungarian user does, with a decimal comma. */
  async fillTrip(trip: Trip) {
    await this.distance.fill(String(trip.distanceKm));
    await this.consumption.fill(trip.consumption.toLocaleString("hu-HU"));
    for (let count = 1; count < trip.passengers; count++) {
      await this.morePassengersButton.click();
    }
  }

  /** The length shown on a route option, in km ("2 h 15 min · 231 km" → 231). */
  async routeOptionKm(option: Locator) {
    const text = await option.innerText();
    return Number(text.match(/([\d,]+) km/)![1].replace(/,/g, ""));
  }

  carOption(name: string) {
    return this.carOptions.filter({ hasText: name });
  }

  async openCarPicker() {
    await this.carRow.click();
    await expect(this.carPicker).toBeVisible();
  }

  /** Picks a saved car, or "Custom values", in the car picker. */
  async chooseCar(name: string) {
    await this.openCarPicker();
    await this.carOption(name).click();
    await expect(this.carPicker).toBeHidden();
  }

  fuelTypeButton(fuelType: FuelType) {
    return this.fuelTypeButtons.getByRole("button", { name: fuelType.label, exact: true });
  }

  async selectFuelType(fuelType: FuelType) {
    await this.fuelTypeButton(fuelType).click();
  }
}
