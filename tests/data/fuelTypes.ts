/** Fuel types as labelled in the trip panel and as named by the price server. */
export const PETROL_95 = { label: "95 Petrol", serverName: "95-petrol" } as const;
export const DIESEL = { label: "Diesel", serverName: "Diesel" } as const;
export const FUEL_TYPES = [PETROL_95, DIESEL] as const;

export const SERVER_FUEL_TYPES = ["95-petrol", "Diesel", "100-petrol"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
export type ServerFuelType = (typeof SERVER_FUEL_TYPES)[number];
