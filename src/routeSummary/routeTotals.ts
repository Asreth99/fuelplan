/**
 * Google's answer for the planned route, and which of its route options the user chose.
 * Google can offer alternatives (only for routes without stops); option 0 is its recommendation.
 */
export type RouteChoice = {
  directions: google.maps.DirectionsResult | null;
  routeIndex: number;
  onSelectRoute: (index: number) => void;
};

// A route with stops has one leg per section (A→B, B→C, …); every total must add them all up.
export function routeTotals(directions: google.maps.DirectionsResult | null, routeIndex = 0) {
  const legs = directions?.routes[routeIndex]?.legs ?? [];
  if (legs.length === 0) return null;
  return {
    meters: legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0),
    seconds: legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0),
  };
}

export const formatDistance = (meters: number) =>
  `${Math.round(meters / 1000).toLocaleString("en-GB")} km`;

export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}
