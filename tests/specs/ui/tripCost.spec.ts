import { test, expect } from "../../fixtures";
import { SHORT_TRIP } from "../../data/trips";
import { FUEL_TYPES } from "../../data/fuelTypes";
import { ExpectedCost } from "../../utils/expectedCost";

test.describe("Trip cost on desktop", () => {
  test.beforeEach(async ({ app }) => {
    await test.step("Open FuelPlan; the trip panel is visible next to the map", async () => {
      await app.open();
    });
  });

  test("asks for the missing values instead of showing a cost", async ({ trip }) => {
    await test.step("Wait for today's fuel price to be filled in automatically", async () => {
      // Until it arrives, the hint rightly asks for the fuel price too.
      await expect(trip.price).not.toHaveValue("", { timeout: 60_000 });
    });

    await test.step("Expect the cost card to ask for the distance and consumption", async () => {
      await expect(trip.costHint).toContainText("distance and consumption");
    });

    await test.step("Expect no cost to be shown yet", async () => {
      await expect(trip.totalCost).toBeHidden();
    });
  });

  for (const fuel of FUEL_TYPES) {
    test(`fills today's ${fuel.label} average price automatically`, async ({ trip, priceApi }) => {
      const average = await test.step(`Ask the price server for today's ${fuel.label} average`, () =>
        priceApi.getAverage(fuel.serverName)
      );

      await test.step(`Select ${fuel.label} as the fuel type`, async () => {
        await trip.selectFuelType(fuel);
      });

      await test.step(`Expect the price field to show the ${fuel.label} average (${average} Ft/L) without pressing anything`, async () => {
        // The price server may need a cold start before it answers.
        await expect(trip.price).toHaveValue(average, { timeout: 60_000 });
      });
    });
  }

  test("the refresh button fetches today's prices again, with visible feedback", async ({ trip, priceApi }) => {
    const average = await test.step("Ask the price server for today's 95 Petrol average", () =>
      priceApi.getAverage("95-petrol")
    );

    await test.step("Overwrite the fuel price with a custom 800 Ft/L", async () => {
      await expect(trip.price).toHaveValue(average, { timeout: 60_000 });
      await trip.price.fill("800");
    });

    await test.step("Press the refresh button next to the price", async () => {
      await trip.refreshPriceButton.click();
    });

    await test.step("Expect the button to show it is working (spinning) while the prices are fetched", async () => {
      await expect(trip.refreshPriceButton).toHaveAttribute("aria-busy", "true");
    });

    await test.step(`Expect the price to be today's average again (${average} Ft/L) and the button to stop spinning`, async () => {
      // A real refresh scrapes holtankoljak.hu, which can take a while.
      await expect(trip.price).toHaveValue(average, { timeout: 60_000 });
      await expect(trip.refreshPriceButton).toHaveAttribute("aria-busy", "false");
    });
  });

  test("number fields accept only digits and one decimal separator", async ({ trip }) => {
    await test.step("Type '7a0b9,5x.3' into the fuel price, key by key", async () => {
      await trip.price.clear();
      await trip.price.pressSequentially("7a0b9,5x.3");
    });

    await test.step("Expect the letters and the second separator to be ignored, leaving '709,53'", async () => {
      await expect(trip.price).toHaveValue("709,53");
    });
  });

  test("shows the one-way, round-trip and per-person cost live", async ({ trip }) => {
    const tripData = SHORT_TRIP;

    await test.step(
      `Enter a ${tripData.distanceKm} km trip at ${tripData.consumption} L/100km (typed with a decimal comma) for ${tripData.passengers} passengers`,
      async () => {
        await trip.fillTrip(tripData);
      }
    );

    const pricePerLiter = await test.step("Read today's fuel price, filled in automatically", async () => {
      await expect(trip.price).not.toHaveValue("", { timeout: 60_000 });
      return Number(await trip.price.inputValue());
    });

    const expected = new ExpectedCost(tripData, pricePerLiter);

    await test.step(`Expect the one-way cost to be ${expected.oneWay}, ${expected.oneWayPerPassenger} per person, without pressing any button`, async () => {
      await expect(trip.totalCost).toHaveText(expected.oneWay);
      await expect(trip.costPerPerson).toHaveText(expected.oneWayPerPassenger);
    });

    await test.step("Switch the cost card to Round trip", async () => {
      await trip.roundTripButton.click();
    });

    await test.step(`Expect the round-trip cost to be ${expected.returnTrip}, ${expected.returnTripPerPassenger} per person`, async () => {
      await expect(trip.totalCost).toHaveText(expected.returnTrip);
      await expect(trip.costPerPerson).toHaveText(expected.returnTripPerPassenger);
    });
  });
});
