import { test, BrowserContext, Page, Browser, chromium } from '@playwright/test';
import { writeFile } from 'fs/promises';

const fuelTypes = ['95-petrol', 'Diesel', '100-petrol'];
let context: BrowserContext;
let page: Page;
let browser: Browser;

test.describe('Get fuel avg price', () => {

 

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('https://holtankoljak.hu/');
  });

  
test('has title', {tag: '@scrape'}, async () => {

  const priceContainer = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.d-flex.mb-3')).map(div => {
      const prices = Array.from(div.querySelectorAll('.ar')).map(price => 
        price.textContent.replace(/\s+/g, ' ').trim()
      );
      return prices;
    }

    );
  });

  const formatJSON = priceContainer.map((row, idx)=> ({
    fuelType: fuelTypes[idx],
    minimum: row[0],
    average: row[1],
    maximum: row[2],
  }));
  await writeFile('fuelPrices.json', JSON.stringify(formatJSON, null, 2), 'utf-8');
  console.log(formatJSON);

});
});

