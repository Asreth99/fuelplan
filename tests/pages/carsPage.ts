import { expect, Locator, Page } from "@playwright/test";
import { Car } from "../data/cars";

/** "My cars": the list of saved cars and the add / edit dialog. */
export class CarsPage {
  readonly heading: Locator;
  readonly count: Locator;
  readonly newCarButton: Locator;
  readonly addCarButton: Locator;
  readonly emptyState: Locator;
  readonly tiles: Locator;
  readonly defaultBadge: Locator;
  readonly editor: Locator;
  readonly nameField: Locator;
  readonly consumptionField: Locator;
  readonly defaultSwitch: Locator;
  readonly customColorSwatch: Locator;
  readonly customColorInput: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly deleteQuestion: Locator;
  readonly preview: Locator;
  readonly previewBadge: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "My cars" });
    this.count = page.getByText(/^\d+ saved cars?$/);
    this.newCarButton = page.getByRole("button", { name: "New car" });
    this.addCarButton = page.getByRole("button", { name: "Add a car" });
    this.emptyState = page.getByRole("heading", { name: "No saved cars yet" });
    this.tiles = page.getByRole("list", { name: "Saved cars" }).getByRole("button");
    this.defaultBadge = this.tiles.filter({ hasText: "Default" });
    this.editor = page.getByRole("dialog", { name: /^(New|Edit) car$/ });
    this.nameField = this.editor.getByRole("textbox", { name: "Name" });
    this.consumptionField = this.editor.getByRole("textbox", { name: "Average consumption" });
    this.defaultSwitch = this.editor.getByRole("switch");
    this.customColorSwatch = this.editor.getByRole("radio", { name: "Custom colour" });
    this.customColorInput = this.editor.getByLabel("Pick a custom colour");
    this.saveButton = this.editor.getByRole("button", { name: "Save" });
    // Pressing Delete asks once more, and the same button then confirms.
    this.deleteButton = this.editor.getByRole("button", { name: "Delete" });
    this.deleteQuestion = this.editor.getByText(/^Delete .+\?$/);
    // The live preview at the top of the dialog. It is decorative (aria-hidden), so it has no role;
    // its badge is the only element in it with an inline colour.
    this.preview = this.editor.getByTestId("car-preview");
    this.previewBadge = this.preview.locator("[style]");
  }

  tile(name: string) {
    return this.page.getByRole("button", { name: `Edit ${name}` });
  }

  /** An editor field; its error message is its accessible description. */
  field(name: "name" | "consumption") {
    return name === "name" ? this.nameField : this.consumptionField;
  }

  /** Opens the editor from the header button, or from the empty state's button when there are no cars. */
  async openNewCarEditor() {
    await this.newCarButton.or(this.addCarButton).click();
    await expect(this.nameField).toBeFocused();
  }

  async fillCar(car: Car) {
    await this.nameField.fill(car.name);
    await this.editor.getByRole("button", { name: car.fuel.label, exact: true }).click();
    await this.consumptionField.fill(String(car.consumption));
  }

  async addCar(car: Car) {
    await this.openNewCarEditor();
    await this.fillCar(car);
    await this.saveButton.click();
    await expect(this.tile(car.name)).toBeVisible();
  }

  async openCar(name: string) {
    await this.tile(name).click();
    // Editing doesn't focus a field (no phone keyboard popping up); the filled-in name shows it's open.
    await expect(this.nameField).toHaveValue(name);
  }

  async makeDefault(name: string) {
    await this.openCar(name);
    await this.defaultSwitch.check({ force: true });
    await this.saveButton.click();
    await expect(this.editor).toBeHidden();
  }

  async deleteCar(name: string) {
    await this.openCar(name);
    await this.deleteButton.click();
    await expect(this.deleteQuestion).toBeVisible();
    await this.deleteButton.click();
    await expect(this.tile(name)).toBeHidden();
  }
}
