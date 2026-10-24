import { test, expect } from "../../fixtures";
import { GOOGLE_ACCOUNT } from "../../data/accounts";
import { CUSTOM_COLOR, CUSTOM_COLOR_RGB, FABIA, GOLF, INVALID_CARS, TRANSIT } from "../../data/cars";

test.describe("Saved cars", () => {
  test.beforeEach(async ({ app, emulator, menu }) => {
    await test.step("Start with no test accounts and no saved cars in the local Firebase emulator", async () => {
      await emulator.reset();
    });

    await test.step("Open FuelPlan and go to Cars in the menu", async () => {
      await app.open();
      await menu.openCars();
    });
  });

  test("signed out, Cars asks to sign in first", async ({ signIn, cars }) => {
    await test.step("Expect 'Sign in to save your cars' with the sign-in options, and no car list", async () => {
      await expect(signIn.heading).toHaveText("Sign in to save your cars");
      await expect(signIn.googleButton).toBeVisible();
      await expect(cars.newCarButton).toBeHidden();
    });
  });

  test.describe("signed in", () => {
    test.beforeEach(async ({ signIn, cars }) => {
      await test.step(`Sign in with Google as ${GOOGLE_ACCOUNT.email}`, async () => {
        await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
        await expect(cars.heading).toBeVisible();
      });
    });

    test("a new account starts with the empty state, and the first car becomes the default", async ({ cars }) => {
      await test.step("Expect 'No saved cars yet' with a single 'Add a car' button", async () => {
        await expect(cars.emptyState).toBeVisible();
        await expect(cars.addCarButton).toBeVisible();
        await expect(cars.newCarButton).toBeHidden();
      });

      await test.step("Press 'Add a car'", async () => {
        await cars.openNewCarEditor();
      });

      await test.step("Expect the Default car switch to be on and locked: the first car is always the default", async () => {
        await expect(cars.defaultSwitch).toBeChecked();
        await expect(cars.defaultSwitch).toBeDisabled();
      });

      await test.step(`Save ${GOLF.name}: ${GOLF.details}`, async () => {
        await cars.fillCar(GOLF);
        await cars.saveButton.click();
      });

      await test.step(`Expect one car, ${GOLF.name} with '${GOLF.details}' and the Default badge`, async () => {
        await expect(cars.count).toHaveText("1 saved car");
        await expect(cars.tile(GOLF.name)).toContainText(GOLF.details);
        await expect(cars.tile(GOLF.name)).toContainText("Default");
      });
    });

    for (const invalid of INVALID_CARS) {
      test(`refuses a car with ${invalid.what}`, async ({ cars }) => {
        await test.step(`Open the new car dialog and enter a car with ${invalid.what}`, async () => {
          await cars.openNewCarEditor();
          await cars.fillCar(invalid.car);
        });

        await test.step("Press Save", async () => {
          await cars.saveButton.click();
        });

        await test.step(`Expect '${invalid.message}' under the ${invalid.field} field, which gets the focus`, async () => {
          await expect(cars.field(invalid.field)).toHaveAccessibleDescription(invalid.message);
          await expect(cars.field(invalid.field)).toHaveAttribute("aria-invalid", "true");
          await expect(cars.field(invalid.field)).toBeFocused();
        });

        await test.step("Expect the dialog to stay open with nothing saved", async () => {
          await expect(cars.editor).toBeVisible();
          await expect(cars.tiles).toHaveCount(0);
        });
      });
    }

    test("edits a car by tapping its tile", async ({ cars }) => {
      await test.step(`Save ${GOLF.name}`, async () => {
        await cars.addCar(GOLF);
      });

      await test.step(`Tap ${GOLF.name} and change it to ${FABIA.name}, ${FABIA.details}`, async () => {
        await cars.openCar(GOLF.name);
        await cars.fillCar(FABIA);
        await cars.saveButton.click();
      });

      await test.step(`Expect a single car: ${FABIA.name} with '${FABIA.details}'`, async () => {
        await expect(cars.tiles).toHaveCount(1);
        await expect(cars.tile(FABIA.name)).toContainText(FABIA.details);
      });
    });

    test("exactly one car is the default, and deleting it passes the default on", async ({ cars }) => {
      await test.step(`Save ${GOLF.name}, ${FABIA.name} and ${TRANSIT.name}`, async () => {
        await cars.addCar(GOLF);
        await cars.addCar(FABIA);
        await cars.addCar(TRANSIT);
      });

      await test.step(`Make ${TRANSIT.name} the default`, async () => {
        await cars.makeDefault(TRANSIT.name);
      });

      await test.step(`Expect only ${TRANSIT.name} to carry the Default badge`, async () => {
        await expect(cars.defaultBadge).toHaveCount(1);
        await expect(cars.tile(TRANSIT.name)).toContainText("Default");
      });

      await test.step(`Delete ${TRANSIT.name}, confirming in the dialog`, async () => {
        await cars.deleteCar(TRANSIT.name);
      });

      await test.step(`Expect the first remaining car, ${GOLF.name}, to become the default`, async () => {
        await expect(cars.count).toHaveText("2 saved cars");
        await expect(cars.defaultBadge).toHaveCount(1);
        await expect(cars.tile(GOLF.name)).toContainText("Default");
      });
    });

    test("delete asks once more before removing the car", async ({ cars }) => {
      await test.step(`Save ${GOLF.name} and open it`, async () => {
        await cars.addCar(GOLF);
        await cars.openCar(GOLF.name);
      });

      await test.step("Press Delete", async () => {
        await cars.deleteButton.click();
      });

      await test.step(`Expect the question 'Delete ${GOLF.name}?' in the dialog, with the car still saved`, async () => {
        await expect(cars.deleteQuestion).toHaveText(`Delete ${GOLF.name}?`);
        await expect(cars.tile(GOLF.name)).toBeAttached();
      });
    });

    test("the dialog previews the car as it is being filled in", async ({ cars }) => {
      await test.step("Open the new car dialog", async () => {
        await cars.openNewCarEditor();
      });

      await test.step("Expect a placeholder preview: 'Your car' with the default fuel, Diesel", async () => {
        await expect(cars.preview).toHaveText("Your carDiesel");
      });

      await test.step(`Enter ${FABIA.name}: ${FABIA.details}`, async () => {
        await cars.fillCar(FABIA);
      });

      await test.step(`Expect the preview to read '${FABIA.name}' and '${FABIA.details}'`, async () => {
        await expect(cars.preview).toHaveText(`${FABIA.name}${FABIA.details}`);
      });
    });

    test("a custom colour is kept and shown as custom when the car is reopened", async ({ cars }) => {
      await test.step(`Open the new car dialog for ${GOLF.name} and pick the custom colour ${CUSTOM_COLOR}`, async () => {
        await cars.openNewCarEditor();
        await cars.fillCar(GOLF);
        await cars.customColorInput.fill(CUSTOM_COLOR);
      });

      await test.step(`Expect the custom swatch to be the selected colour, and the preview badge to turn ${CUSTOM_COLOR}`, async () => {
        await expect(cars.customColorSwatch).toHaveAttribute("aria-checked", "true");
        await expect(cars.previewBadge).toHaveCSS("background-color", CUSTOM_COLOR_RGB);
      });

      await test.step(`Save and reopen ${GOLF.name}`, async () => {
        await cars.saveButton.click();
        await cars.openCar(GOLF.name);
      });

      await test.step(`Expect the custom swatch to be selected, holding ${CUSTOM_COLOR}`, async () => {
        await expect(cars.customColorSwatch).toHaveAttribute("aria-checked", "true");
        await expect(cars.customColorInput).toHaveValue(CUSTOM_COLOR);
      });
    });

    test("saved cars are still there after a reload", async ({ app, cars, menu }) => {
      await test.step(`Save ${GOLF.name} and ${FABIA.name}`, async () => {
        await cars.addCar(GOLF);
        await cars.addCar(FABIA);
      });

      await test.step("Reload the page and go to Cars again", async () => {
        await app.reload();
        await menu.openCars();
      });

      await test.step(`Expect both cars, in the order they were added: ${GOLF.name}, ${FABIA.name}`, async () => {
        await expect(cars.tiles).toHaveCount(2);
        await expect(cars.tiles.first()).toContainText(GOLF.name);
        await expect(cars.tiles.last()).toContainText(FABIA.name);
      });
    });
  });
});
