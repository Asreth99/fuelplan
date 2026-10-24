import { DIESEL, FuelType, PETROL_95 } from "./fuelTypes";

export type Car = {
  name: string;
  fuel: FuelType;
  consumption: number;
  // As listed in the app: "6.5 L/100 km · Diesel"
  details: string;
};

export const GOLF: Car = { name: "Golf VII", fuel: DIESEL, consumption: 6.5, details: "6.5 L/100 km · Diesel" };
export const FABIA: Car = { name: "Skoda Fabia", fuel: PETROL_95, consumption: 5.4, details: "5.4 L/100 km · 95 Petrol" };
export const TRANSIT: Car = { name: "Company Transit", fuel: DIESEL, consumption: 9.1, details: "9.1 L/100 km · Diesel" };

/** Values the editor must refuse, with the message it shows. */
export const INVALID_CARS = [
  { what: "no name", car: { ...GOLF, name: "" }, field: "name", message: "Give the car a name." },
  {
    what: "a consumption above 40",
    car: { ...GOLF, consumption: 45 },
    field: "consumption",
    message: "Enter a value between 1 and 40 L/100 km.",
  },
  {
    what: "a consumption below 1",
    car: { ...GOLF, consumption: 0.5 },
    field: "consumption",
    message: "Enter a value between 1 and 40 L/100 km.",
  },
] as const;

export const CUSTOM_COLOR = "#ff66cc";
// The same colour as the browser reports it in computed styles
export const CUSTOM_COLOR_RGB = "rgb(255, 102, 204)";
