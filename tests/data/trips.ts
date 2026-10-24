export type Trip = {
  distanceKm: number;
  consumption: number;
  passengers: number;
};

export type Route = {
  from: string;
  to: string;
};

export const SHORT_TRIP: Trip = {
  distanceKm: 230,
  consumption: 6.5,
  passengers: 2,
};

export const BUDAPEST_TO_DEBRECEN: Route = {
  from: "Budapest",
  to: "Debrecen",
};

// Far from Debrecen (the mocked user location), so the map has to move to show the user.
export const BUDAPEST_TO_SZEGED: Route = {
  from: "Budapest",
  to: "Szeged",
};

// A stop well off the Budapest–Debrecen road, so adding it clearly lengthens the trip.
export const DETOUR_STOP = "Szeged";

// No driving route exists across the Atlantic.
export const BUDAPEST_TO_NEW_YORK: Route = {
  from: "Budapest",
  to: "New York",
};
