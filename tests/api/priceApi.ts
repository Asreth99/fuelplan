import { APIRequestContext, expect } from "@playwright/test";
import { ServerFuelType } from "../data/fuelTypes";

export type FuelPrice = {
  fuelType: ServerFuelType;
  minimum: string;
  average: string;
  maximum: string;
};

/** Client for the local price server's `/scrape` endpoint. */
export class PriceApi {
  private static readonly SCRAPE_URL = "http://localhost:3001/scrape";

  constructor(private readonly request: APIRequestContext) {}

  async getPrices(): Promise<FuelPrice[]> {
    // Scraping launches a browser on the server, so the first call can be slow.
    const response = await this.request.get(PriceApi.SCRAPE_URL, {
      timeout: 60_000,
    });
    expect(response.ok(), "price server responded").toBeTruthy();
    return response.json();
  }

  async getAverage(fuelType: ServerFuelType) {
    const prices = await this.getPrices();
    return prices.find((price) => price.fuelType === fuelType)!.average;
  }
}
