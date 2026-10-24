import { Trip } from "../data/trips";

/** Expected trip costs, rounded and formatted exactly as the fuel cost card shows them. */
export class ExpectedCost {
  // The app rounds each total from the exact litres; the per-person share comes from the rounded total.
  private readonly oneWayHuf: number;
  private readonly returnTripHuf: number;

  constructor(private readonly trip: Trip, pricePerLiter: number) {
    const litersOneWay = (trip.distanceKm / 100) * trip.consumption;
    this.oneWayHuf = Math.round(litersOneWay * pricePerLiter);
    this.returnTripHuf = Math.round(litersOneWay * 2 * pricePerLiter);
  }

  get oneWay() {
    return this.format(this.oneWayHuf);
  }

  get returnTrip() {
    return this.format(this.returnTripHuf);
  }

  get oneWayPerPassenger() {
    return this.format(this.oneWayHuf / this.trip.passengers);
  }

  get returnTripPerPassenger() {
    return this.format(this.returnTripHuf / this.trip.passengers);
  }

  private format(huf: number) {
    return `${Math.round(huf).toLocaleString("hu-HU")} Ft`;
  }
}
