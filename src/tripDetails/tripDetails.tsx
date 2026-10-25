import { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import helper, { FuelPriceData, toDecimalInput } from "../calculator/helper";
import Icon, { IconName } from "../icons/icon";
import { formatDistance, formatDuration, RouteChoice, routeTotals } from "../routeSummary/routeTotals";
import CarAvatar from "../cars/carAvatar";
import CarPicker from "../cars/carPicker";
import { carDetails, FUEL_LABELS, formatConsumption, FuelKind } from "../cars/carRepository";
import { useCars } from "../cars/useCars";
import "./tripDetails.css";

type Props = {
  routes: RouteChoice;
};

const FUEL_TYPES: { kind: FuelKind; label: string; serverName: string }[] = [
  { kind: "petrol95", label: FUEL_LABELS.petrol95, serverName: "95-petrol" },
  { kind: "diesel", label: FUEL_LABELS.diesel, serverName: "Diesel" },
];
const fuelTypeOf = (kind: FuelKind) => FUEL_TYPES.find((type) => type.kind === kind)!;
const MAX_PASSENGERS = 9;

const toNumber = (value: string) => Number(value.replace(",", "."));
const formatHuf = (amount: number) => `${Math.round(amount).toLocaleString("hu-HU")} Ft`;

export default function TripDetails({ routes }: Props) {
  const [distance, setDistance] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelType, setFuelType] = useState(FUEL_TYPES[0]);
  const [price, setPrice] = useState("");
  const [prices, setPrices] = useState<FuelPriceData[] | null>(null);
  const [priceStatus, setPriceStatus] = useState<"loading" | "ok" | "error">("loading");
  const [passengers, setPassengers] = useState(1);
  const [roundTrip, setRoundTrip] = useState(false);

  // The chosen route option fills the distance (also when the user switches to another option).
  const routeMeters = routeTotals(routes.directions, routes.routeIndex)?.meters;
  const routeOptions = routes.directions?.routes ?? [];
  const todaysPrice = prices?.find((p) => p.fuelType === fuelType.serverName);

  useEffect(() => {
    if (routeMeters !== undefined) setDistance((routeMeters / 1000).toFixed(0));
  }, [routeMeters]);

  const loadPrices = useCallback(() => {
    setPriceStatus("loading");
    helper
      .getFuelPrice()
      .then((data) => {
        setPrices(data);
        setPriceStatus("ok");
      })
      .catch(() => setPriceStatus("error"));
  }, []);
  useEffect(loadPrices, [loadPrices]);

  // Today's average fills the price whenever fresh prices arrive or the fuel type changes.
  useEffect(() => {
    if (todaysPrice) setPrice(todaysPrice.average);
  }, [todaysPrice]);

  const { selectedCar } = useCars();
  const [pickerOpen, setPickerOpen] = useState(false);
  const carRow = useRef<HTMLButtonElement>(null);

  // A selected car sets the consumption, the fuel and today's price for that fuel. When it is
  // deselected, deleted or the user signs out, its numbers stay as Custom values, so the cost doesn't jump.
  useEffect(() => {
    if (!selectedCar) return;
    setConsumption(formatConsumption(selectedCar.consumption));
    setFuelType(fuelTypeOf(selectedCar.fuel));
  }, [selectedCar]);
  const selectedCarId = selectedCar?.id;
  useEffect(() => {
    const todays = selectedCar && prices?.find((p) => p.fuelType === fuelTypeOf(selectedCar.fuel).serverName);
    if (todays) setPrice(todays.average);
    // Only when another car is picked: an edit on another device must not overwrite a typed price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCarId]);

  const missing = [
    !(toNumber(distance) > 0) && "distance",
    !(toNumber(consumption) > 0) && "consumption",
    !(toNumber(price) > 0) && "fuel price",
  ].filter(Boolean) as string[];

  const tripFactor = roundTrip ? 2 : 1;
  const totalCost = Math.round(
    helper.calculateFuelCost(toNumber(distance) * tripFactor, consumption, price)
  );
  const liters = ((toNumber(distance) * tripFactor) / 100) * toNumber(consumption);

  const priceNote =
    priceStatus === "loading"
      ? "Checking today's prices…"
      : priceStatus === "error"
        ? "Couldn't load today's price. Enter it yourself."
        : todaysPrice && price === todaysPrice.average
          ? `Today's ${fuelType.label} average · ${Math.round(Number(todaysPrice.minimum))}–${Math.round(Number(todaysPrice.maximum))} Ft`
          : "Your price · tap ↻ for today's average";

  return (
    <section className="trip" aria-label="Trip cost">
      <div className="trip__cost" role="group" aria-label="Fuel cost" aria-live="polite">
        <div className="seg trip__seg" role="group" aria-label="Trip type">
          <button type="button" aria-pressed={!roundTrip} onClick={() => setRoundTrip(false)}>
            One way
          </button>
          <button type="button" aria-pressed={roundTrip} onClick={() => setRoundTrip(true)}>
            Round trip
          </button>
        </div>
        <span className="trip__cost-label">Fuel cost</span>
        {missing.length === 0 ? (
          <>
            <strong className="trip__cost-value" data-testid="total-cost">
              {formatHuf(totalCost)}
            </strong>
            <span className="trip__cost-detail">
              {passengers > 1 && (
                <>
                  <b data-testid="cost-per-person">{formatHuf(totalCost / passengers)}</b> / person ·{" "}
                </>
              )}
              {liters.toLocaleString("en-GB", { maximumFractionDigits: 1 })} L of fuel
            </span>
          </>
        ) : (
          <p className="trip__cost-hint">Add the {joinWords(missing)} to see the cost.</p>
        )}
      </div>

      <div className="trip__rows">
        {/* Google's alternatives, also tappable as light green lines on the map */}
        {routeOptions.length > 1 && (
          <div className="trip__row">
            <span className="trip__row-icon">
              <Icon name="route" />
            </span>
            <span className="trip__row-label" id="route-options-label">
              Route options
            </span>
            <div className="trip__route-options" role="group" aria-labelledby="route-options-label">
              {routeOptions.map((_, index) => {
                const totals = routeTotals(routes.directions, index)!;
                return (
                  <button
                    key={index}
                    type="button"
                    className="chip"
                    aria-pressed={index === routes.routeIndex}
                    onClick={() => routes.onSelectRoute(index)}
                  >
                    {formatDuration(totals.seconds)} · {formatDistance(totals.meters)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <NumberRow icon="route" label="Distance" unit="km" value={distance} onChange={setDistance} />

        <button
          ref={carRow}
          type="button"
          className="trip__row trip__car"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
        >
          <CarAvatar color={selectedCar?.color ?? null} />
          <span className="trip__car-text">
            <span className="trip__car-label">Car</span>
            <span className="trip__car-value" data-testid="selected-car">
              {selectedCar
                ? `${selectedCar.name} · ${carDetails(selectedCar)}`
                : toNumber(consumption) > 0
                  ? `Custom · ${carDetails({ consumption: toNumber(consumption), fuel: fuelType.kind })}`
                  : "Custom values"}
            </span>
          </span>
          <Icon name="chevron" className="trip__car-chevron" />
        </button>
        {pickerOpen && <CarPicker anchor={carRow.current} onClose={() => setPickerOpen(false)} />}

        {/* Custom values: today's rows for consumption and fuel type */}
        {!selectedCar && (
          <>
            <NumberRow icon="gauge" label="Consumption" unit="L/100 km" value={consumption} onChange={setConsumption} />
            <div className="trip__row">
              <span className="trip__row-icon">
                <Icon name="fuel" />
              </span>
              <span className="trip__row-label">Fuel type</span>
              <div className="seg trip__fuel-seg" role="group" aria-label="Fuel type">
                {FUEL_TYPES.map((type) => (
                  <button
                    key={type.label}
                    type="button"
                    aria-pressed={type === fuelType}
                    onClick={() => setFuelType(type)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <NumberRow
          icon="tag"
          label="Fuel price"
          // Which fuel the price is for, also when a saved car hides the fuel type row
          tag={fuelType.label}
          unit="Ft/L"
          value={price}
          onChange={setPrice}
          note={priceNote}
          action={
            <button
              type="button"
              className={`icon-btn${priceStatus === "loading" ? " icon-btn--spinning" : ""}`}
              aria-label="Refresh fuel price"
              aria-busy={priceStatus === "loading"}
              disabled={priceStatus === "loading"}
              title="Fetch today's average again"
              onClick={loadPrices}
            >
              <Icon name="refresh" />
            </button>
          }
        />

        <div className="trip__row">
          <span className="trip__row-icon">
            <Icon name="people" />
          </span>
          <span className="trip__row-label">Passengers</span>
          <div className="trip__stepper">
            <button
              type="button"
              aria-label="Fewer passengers"
              disabled={passengers <= 1}
              onClick={() => setPassengers(passengers - 1)}
            >
              <Icon name="minus" />
            </button>
            <output aria-label="Passengers">{passengers}</output>
            <button
              type="button"
              aria-label="More passengers"
              disabled={passengers >= MAX_PASSENGERS}
              onClick={() => setPassengers(passengers + 1)}
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type NumberRowProps = {
  icon: IconName;
  label: string;
  tag?: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
  action?: ReactNode;
};

function NumberRow({ icon, label, tag, unit, value, onChange, note, action }: NumberRowProps) {
  const id = useId();
  return (
    <div className="trip__row">
      <span className="trip__row-icon">
        <Icon name={icon} />
      </span>
      <label className="trip__row-label" htmlFor={id}>
        {label}
        {tag && <> <span className="trip__row-tag">{tag}</span></>}
      </label>
      <div className="trip__input">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(toDecimalInput(e.target.value))}
        />
        <span className="trip__unit">{unit}</span>
      </div>
      {action}
      {note && <span className="trip__row-note">{note}</span>}
    </div>
  );
}

function joinWords(words: string[]) {
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
