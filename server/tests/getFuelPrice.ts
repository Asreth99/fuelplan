import { chromium, BrowserContext, Browser, Page } from 'playwright';

type FuelRow = {
  fuelType: string,
  minimum: string;
  average: string;
  maximum: string;
};

export async function getFuelPrices(): Promise<FuelRow[]> {
  const fuelTypes = ['95-petrol', 'Diesel', '100-petrol'];
  const browser: Browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();
  await page.goto('https://holtankoljak.hu/');

  const priceContainer: string[][] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.d-flex.mb-3')).map(div => {
      const prices = Array.from(div.querySelectorAll('.ar')).map(price =>
        price.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      );
      return prices;
    });
  });

  const formatJSON: FuelRow[] = priceContainer.map((row, idx) => ({
    fuelType: fuelTypes[idx],
    minimum: row[0],
    average: row[1],
    maximum: row[2],
  }));

  await browser.close();
  return formatJSON;
}