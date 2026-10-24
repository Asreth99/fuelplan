import { test, expect } from "../../fixtures";
import { SERVER_FUEL_TYPES } from "../../data/fuelTypes";

test.describe("Price server", () => {
  test("@scrape /scrape returns plausible prices for every fuel type", async ({ priceApi }) => {
    const prices = await test.step("Ask the price server to scrape today's prices from holtankoljak.hu", () =>
      priceApi.getPrices()
    );

    await test.step(`Expect exactly these fuel types, in this order: ${SERVER_FUEL_TYPES.join(", ")}`, async () => {
      expect(prices.map((price) => price.fuelType)).toEqual(SERVER_FUEL_TYPES);
    });

    for (const price of prices) {
      await test.step(
        `Expect ${price.fuelType} prices (min ${price.minimum}, avg ${price.average}, max ${price.maximum}) to be realistic and ordered`,
        async () => {
          const [min, avg, max] = [price.minimum, price.average, price.maximum].map(Number);
          expect(min, "minimum is above 300 HUF/L").toBeGreaterThan(300);
          expect(max, "maximum is below 1500 HUF/L").toBeLessThan(1500);
          expect(min, "minimum <= average").toBeLessThanOrEqual(avg);
          expect(avg, "average <= maximum").toBeLessThanOrEqual(max);
        }
      );
    }
  });
});
