export type FuelPriceData = {
  fuelType: string;
  minimum: string;
  average: string;
  maximum: string;
};

export function calculateFuelCost(
  distance: number | string,
  consumption: number | string,
  price: number | string
): number {
  const num = (x: number | string) =>
    Number(typeof x === "string" ? x.replace(",", ".") : x);
  console.log("num:" + num(consumption));
  const litersNeeded = (num(distance) / 100) * num(consumption);
  return litersNeeded * num(price);
}

export async function getFuelPrice() {
  const test = process.env.REACT_APP_PROD_SERVER_URL;
  console.log("Server URL: " + test);
  const response = await fetch(
    process.env.REACT_APP_PROD_SERVER_URL + "/scrape"
  );
  if (!response.ok) {
    throw new Error("Hiba a szervertől!");
  }
  const data = await response.json();
  return data as FuelPriceData[];
}

// eslint-disable-next-line import/no-anonymous-default-export
export default { calculateFuelCost, getFuelPrice };
