export type FuelPriceData = {
  fuelType: string;
  minimum: string;
  average: string;
  maximum: string;
};

export function calculateFuelCost(
  distance: number,
  consumption: number,
  price: number
): number {
  const litersNeeded = (distance / 100) * consumption;
  const totalCost = litersNeeded * price;
  return totalCost;
}

export async function getFuelPrice() {
  const response = await fetch(
    process.env.REACT_APP_PROD_SERVER_URL + "/scrape"
  );
  console.log(process.env.REACT_APP_PROD_SERVER_URL + "/scrape");
  if (!response.ok) {
    throw new Error("Hiba a szervertől!");
  }
  const data = await response.json();
  return data as FuelPriceData[];
}

// eslint-disable-next-line import/no-anonymous-default-export
export default { calculateFuelCost, getFuelPrice };
