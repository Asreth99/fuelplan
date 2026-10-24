import { test, expect } from "../../fixtures";
import { GOOGLE_ACCOUNT } from "../../data/accounts";
import { FABIA, GOLF, TRANSIT } from "../../data/cars";
import { SHORT_TRIP } from "../../data/trips";
import { CLOSING_PULL_PX, PHONE, SHORT_PULL_PX } from "../../data/devices";
import { ExpectedCost } from "../../utils/expectedCost";

test.describe("Choosing a car for the trip", () => {
  test.beforeEach(async ({ app, emulator }) => {
    await test.step("Start with no test accounts and no saved cars in the local Firebase emulator", async () => {
      await emulator.reset();
    });

    await test.step("Open FuelPlan", async () => {
      await app.open();
    });
  });

  test("signed out, the picker offers only custom values and a way to sign in", async ({ trip, menu, signIn }) => {
    await test.step("Expect the Car row to show 'Custom values', with the consumption and fuel type rows below", async () => {
      await expect(trip.selectedCar).toHaveText("Custom values");
      await expect(trip.consumption).toBeVisible();
      await expect(trip.fuelTypeButtons).toBeVisible();
    });

    await test.step("Open the car picker", async () => {
      await trip.openCarPicker();
    });

    await test.step("Expect only 'Custom values', plus 'Sign in and save your cars'", async () => {
      await expect(trip.carOptions).toHaveCount(1);
      await expect(trip.carOption("Custom values")).toBeVisible();
      await expect(trip.signInToSaveCarsLink).toBeVisible();
    });

    await test.step("Press 'Sign in and save your cars'", async () => {
      await trip.signInToSaveCarsLink.click();
    });

    await test.step("Expect the Cars screen asking to sign in", async () => {
      await expect(menu.carsScreen).toBeVisible();
      await expect(signIn.heading).toHaveText("Sign in to save your cars");
    });
  });

  test.describe("on a phone", () => {
    test.use(PHONE);

    test("the picker opens as a sheet over the trip and Escape closes it", async ({ trip, app }) => {
      await test.step("Open the car picker from the Car row in the bottom sheet", async () => {
        await trip.openCarPicker();
      });

      await test.step("Press Escape", async () => {
        await app.pressEscape();
      });

      await test.step("Expect the picker to close, leaving the trip on custom values", async () => {
        await expect(trip.carPicker).toBeHidden();
        await expect(trip.selectedCar).toHaveText("Custom values");
      });
    });

    test("the picker sheet can be dragged down to close it", async ({ trip, app }) => {
      await test.step("Open the car picker", async () => {
        await trip.openCarPicker();
      });

      await test.step(`Pull its top bar down just ${SHORT_PULL_PX}px and let go`, async () => {
        await app.dragDialogDown(trip.carPicker, SHORT_PULL_PX);
      });

      await test.step("Expect the sheet to spring back and stay open", async () => {
        await expect(trip.carPicker).toBeVisible();
        await expect(trip.carOption("Custom values")).toBeInViewport();
      });

      await test.step(`Pull it down ${CLOSING_PULL_PX}px`, async () => {
        await app.dragDialogDown(trip.carPicker, CLOSING_PULL_PX);
      });

      await test.step("Expect the picker to close", async () => {
        await expect(trip.carPicker).toBeHidden();
      });
    });

    test("the new car sheet can be dragged down to close it", async ({ app, menu, signIn, cars }) => {
      await test.step("Open Cars and sign in with Google", async () => {
        await menu.openCars();
        await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
      });

      await test.step("Press 'Add a car'", async () => {
        await cars.openNewCarEditor();
      });

      await test.step(`Pull the sheet's top bar down ${CLOSING_PULL_PX}px`, async () => {
        await app.dragDialogDown(cars.editor, CLOSING_PULL_PX);
      });

      await test.step("Expect the sheet to close with nothing saved", async () => {
        await expect(cars.editor).toBeHidden();
        await expect(cars.emptyState).toBeVisible();
      });
    });
  });

  test.describe("signed in with saved cars", () => {
    test.beforeEach(async ({ menu, signIn, cars }) => {
      await test.step(`Sign in with Google and save ${GOLF.name} (default) and ${FABIA.name}`, async () => {
        await menu.openCars();
        await signIn.signInWithGoogle(GOOGLE_ACCOUNT);
        await cars.addCar(GOLF);
        await cars.addCar(FABIA);
      });

      await test.step("Go back to Plan", async () => {
        await menu.openPlan();
      });
    });

    test("the default car is used when the app opens", async ({ app, trip, priceApi }) => {
      await test.step("Reload the app", async () => {
        await app.reload();
      });

      await test.step(`Expect the Car row to show '${GOLF.name} · ${GOLF.details}'`, async () => {
        await expect(trip.selectedCar).toHaveText(`${GOLF.name} · ${GOLF.details}`);
      });

      await test.step("Expect the consumption and fuel type rows to be hidden: the car provides them", async () => {
        await expect(trip.consumption).toBeHidden();
        await expect(trip.fuelTypeButtons).toBeHidden();
      });

      await test.step(`Expect the fuel price row to say which fuel it is for: ${GOLF.fuel.label}`, async () => {
        await expect(trip.price).toHaveAccessibleName(`Fuel price ${GOLF.fuel.label}`);
      });

      const average = await test.step(`Ask the price server for today's ${GOLF.fuel.label} average`, () =>
        priceApi.getAverage(GOLF.fuel.serverName)
      );

      await test.step(`Expect the price to be today's ${GOLF.fuel.label} average (${average} Ft/L)`, async () => {
        await expect(trip.price).toHaveValue(average, { timeout: 60_000 });
      });

      const tripData = { ...SHORT_TRIP, consumption: GOLF.consumption, passengers: 1 };
      const expected = new ExpectedCost(tripData, Number(average));
      await test.step(`Enter ${tripData.distanceKm} km and expect ${expected.oneWay} with the car's ${GOLF.consumption} L/100 km`, async () => {
        await trip.distance.fill(String(tripData.distanceKm));
        await expect(trip.totalCost).toHaveText(expected.oneWay);
      });
    });

    test("picking another car sets its consumption, fuel and today's price", async ({ trip, priceApi }) => {
      const average = await test.step(`Ask the price server for today's ${FABIA.fuel.label} average`, () =>
        priceApi.getAverage(FABIA.fuel.serverName)
      );

      await test.step("Open the picker", async () => {
        await trip.openCarPicker();
      });

      await test.step(`Expect ${GOLF.name}, ${FABIA.name} and 'Custom values', with ${GOLF.name} ticked`, async () => {
        await expect(trip.carOptions).toHaveCount(3);
        await expect(trip.carOption(GOLF.name)).toHaveAttribute("aria-checked", "true");
      });

      await test.step(`Pick ${FABIA.name}`, async () => {
        await trip.carOption(FABIA.name).click();
      });

      await test.step(`Expect the Car row to show ${FABIA.name} and the price today's ${FABIA.fuel.label} average (${average} Ft/L)`, async () => {
        await expect(trip.selectedCar).toHaveText(`${FABIA.name} · ${FABIA.details}`);
        await expect(trip.price).toHaveAccessibleName(`Fuel price ${FABIA.fuel.label}`);
        await expect(trip.price).toHaveValue(average, { timeout: 60_000 });
      });
    });

    test("switching to custom values keeps the car's numbers to edit", async ({ trip }) => {
      await test.step(`Pick ${FABIA.name}, then 'Custom values'`, async () => {
        await trip.chooseCar(FABIA.name);
        await trip.chooseCar("Custom values");
      });

      await test.step(`Expect the consumption row with ${FABIA.consumption} and ${FABIA.fuel.label} selected`, async () => {
        await expect(trip.consumption).toHaveValue(String(FABIA.consumption));
        await expect(trip.fuelTypeButton(FABIA.fuel)).toHaveAttribute("aria-pressed", "true");
      });
    });

    test("a car added from the picker is used for the trip straight away, until the next start", async ({ app, trip, cars }) => {
      await test.step(`Expect the trip to use the default car, ${GOLF.name}`, async () => {
        await expect(trip.selectedCar).toHaveText(`${GOLF.name} · ${GOLF.details}`);
      });

      await test.step(`Press '+ New car' in the picker and save ${TRANSIT.name}`, async () => {
        await trip.openCarPicker();
        await trip.newCarLink.click();
        await cars.fillCar(TRANSIT);
        await cars.saveButton.click();
      });

      await test.step(`Expect the trip to use ${TRANSIT.name}`, async () => {
        await expect(trip.selectedCar).toHaveText(`${TRANSIT.name} · ${TRANSIT.details}`);
      });

      await test.step("Reload the app, as when opening it again", async () => {
        await app.reload();
      });

      await test.step(`Expect the trip to be back on the default car, ${GOLF.name}`, async () => {
        await expect(trip.selectedCar).toHaveText(`${GOLF.name} · ${GOLF.details}`);
      });
    });

    test("a car added on the Cars screen doesn't change the trip's car", async ({ trip, menu, cars }) => {
      await test.step(`Add ${TRANSIT.name} on the Cars screen and go back to Plan`, async () => {
        await menu.openCars();
        await cars.addCar(TRANSIT);
        await menu.openPlan();
      });

      await test.step(`Expect the trip to still use the default car, ${GOLF.name}`, async () => {
        await expect(trip.selectedCar).toHaveText(`${GOLF.name} · ${GOLF.details}`);
      });
    });

    test("deleting the car in use keeps its values as custom", async ({ trip, menu, cars }) => {
      await test.step(`Pick ${FABIA.name} for the trip`, async () => {
        await trip.chooseCar(FABIA.name);
      });

      await test.step(`Delete ${FABIA.name} on the Cars screen and go back to Plan`, async () => {
        await menu.openCars();
        await cars.deleteCar(FABIA.name);
        await menu.openPlan();
      });

      await test.step(`Expect 'Custom · ${FABIA.details}', so the cost doesn't jump`, async () => {
        await expect(trip.selectedCar).toHaveText(`Custom · ${FABIA.details}`);
        await expect(trip.consumption).toHaveValue(String(FABIA.consumption));
      });
    });

    test("signing out keeps the last car's values as custom", async ({ trip, menu, profile }) => {
      await test.step("Sign out on Profile and go back to Plan", async () => {
        await menu.openProfile();
        await profile.signOut();
        await menu.openPlan();
      });

      await test.step(`Expect 'Custom · ${GOLF.details}'`, async () => {
        await expect(trip.selectedCar).toHaveText(`Custom · ${GOLF.details}`);
      });

      await test.step("Expect the picker to offer only custom values again", async () => {
        await trip.openCarPicker();
        await expect(trip.carOptions).toHaveCount(1);
      });
    });
  });
});
