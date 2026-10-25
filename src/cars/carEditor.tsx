import { CSSProperties, FormEvent, useRef, useState } from "react";
import Icon from "../icons/icon";
import Modal from "../modal/modal";
import { toDecimalInput } from "../calculator/helper";
import { useToast } from "../toast/toast";
import CarAvatar, { iconColorOn } from "./carAvatar";
import {
  CAR_COLORS,
  carDetails,
  FUEL_LABELS,
  formatConsumption,
  FuelKind,
  MAX_NAME_LENGTH,
  validateCar,
} from "./carRepository";
import { useCars } from "./useCars";
import "./cars.css";

const CUSTOM_COLOR_START = "#ff8fb1";

/** Add / edit a car: a centred dialog on desktop, a bottom sheet on phones. */
export default function CarEditor() {
  const { cars, defaultCarId, editor, closeEditor, saveCar, deleteCar, selectCar } = useCars();
  const existing = editor?.car ?? null;
  const showToast = useToast();

  const [name, setName] = useState(existing?.name ?? "");
  const [fuel, setFuel] = useState<FuelKind>(existing?.fuel ?? "diesel");
  const [consumption, setConsumption] = useState(existing ? formatConsumption(existing.consumption) : "");
  // A new car gets the next preset colour, so cars look different.
  const [color, setColor] = useState(existing?.color ?? CAR_COLORS[cars.length % CAR_COLORS.length]);
  const isFirstCar = cars.length === 0 || (cars.length === 1 && existing !== null);
  const isDefault = existing !== null && existing.id === defaultCarId;
  const [makeDefault, setMakeDefault] = useState(isFirstCar || isDefault);
  const [errors, setErrors] = useState<{ name?: string; consumption?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const consumptionInput = useRef<HTMLInputElement>(null);

  const customColor = !CAR_COLORS.includes(color);
  const consumptionValue = Number(consumption.replace(",", "."));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const car = { name: name.trim(), fuel, consumption: consumptionValue, color };
    const found = validateCar(car);
    setErrors(found);
    if (found.name) return nameInput.current?.focus();
    if (found.consumption) return consumptionInput.current?.focus();

    const id = saveCar(existing?.id ?? null, car, makeDefault);
    // Added from the trip's picker: the trip uses it right away (this once; on the next start it's the
    // default car again). The very first car becomes the default, so the trip uses it too.
    if (!existing && (editor?.useForTrip || isFirstCar)) selectCar(id);
    showToast(existing ? "Car saved" : `${car.name} added`);
    closeEditor();
  };

  const remove = () => {
    deleteCar(existing!.id);
    showToast(`${existing!.name} deleted`);
    closeEditor();
  };

  return (
    <Modal title={existing ? "Edit car" : "New car"} onClose={closeEditor}>
      <form className="car-form" noValidate onSubmit={submit}>
        {/* Live preview: the car as it will look in the list and the trip card */}
        <div className="car-form__preview" aria-hidden="true" data-testid="car-preview">
          <CarAvatar color={color} />
          <span className="car-main">
            <span className="car-name">{name.trim() || "Your car"}</span>
            <span className="car-meta">
              {consumptionValue > 0 ? carDetails({ consumption: consumptionValue, fuel }) : FUEL_LABELS[fuel]}
            </span>
          </span>
        </div>

        <label className="field">
          <span className="field__label">Name</span>
          <input
            ref={nameInput}
            className="field__input"
            // A new car starts with typing its name; editing usually changes something else, and
            // focusing the field would pop up the phone keyboard over the dialog for nothing.
            data-autofocus={!existing || undefined}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. Family Golf"
            autoComplete="off"
            value={name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="car-name-error"
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <span className="field__error" id="car-name-error">
              {errors.name}
            </span>
          )}
        </label>

        <div className="field">
          <span className="field__label" id="car-fuel-label">
            Fuel
          </span>
          <div className="seg car-form__seg" role="group" aria-labelledby="car-fuel-label">
            {(Object.keys(FUEL_LABELS) as FuelKind[]).map((kind) => (
              <button key={kind} type="button" aria-pressed={fuel === kind} onClick={() => setFuel(kind)}>
                {FUEL_LABELS[kind]}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">Average consumption</span>
          <span className="field__input car-form__number">
            <input
              ref={consumptionInput}
              inputMode="decimal"
              placeholder="e.g. 6.5"
              autoComplete="off"
              value={consumption}
              aria-invalid={Boolean(errors.consumption)}
              aria-describedby="car-consumption-hint"
              onChange={(e) => setConsumption(toDecimalInput(e.target.value))}
            />
            <span className="car-form__unit">L/100 km</span>
          </span>
          {errors.consumption ? (
            <span className="field__error" id="car-consumption-hint">
              {errors.consumption}
            </span>
          ) : (
            <span className="field__hint" id="car-consumption-hint">
              From the trip computer or the car's papers.
            </span>
          )}
        </label>

        <div className="field">
          <span className="field__label" id="car-color-label">
            Colour
          </span>
          <div className="swatches" role="radiogroup" aria-labelledby="car-color-label">
            {CAR_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                role="radio"
                className="swatch"
                style={{ "--swatch": preset } as CSSProperties}
                aria-checked={color === preset}
                aria-label={`Colour ${preset}`}
                onClick={() => setColor(preset)}
              />
            ))}
            {/* Any colour, through the system colour picker (RGB/HSL/HEX on desktop, a colour sheet on phones).
                Empty with a palette icon until used; then it fills with the chosen colour. */}
            <label
              className="swatch swatch--custom"
              aria-checked={customColor}
              role="radio"
              aria-label="Custom colour"
              title="Custom colour"
              style={customColor ? ({ "--swatch": color, color: iconColorOn(color) } as CSSProperties) : undefined}
            >
              <Icon name="palette" />
              <input
                type="color"
                aria-label="Pick a custom colour"
                value={customColor ? color : CUSTOM_COLOR_START}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
          </div>
        </div>

        <label className="switch-row">
          <span>
            <b>Default car</b>
            <small>
              {isFirstCar
                ? "Your first car is always the default."
                : isDefault
                  ? "To change it, make another car the default."
                  : "We use this car when you open the app."}
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={makeDefault}
            disabled={isFirstCar || isDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
          />
          <span className="switch" aria-hidden="true" />
        </label>

        {/* Delete asks once more, inline: iOS home-screen apps suppress the browser's confirm(). */}
        <footer className="car-form__foot">
          {confirmingDelete ? (
            <>
              <span className="car-form__confirm">
                Delete <b>{existing!.name}</b>?
              </span>
              <span className="car-form__actions">
                <button type="button" className="btn btn--secondary" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--danger" onClick={remove}>
                  <Icon name="trash" />
                  Delete
                </button>
              </span>
            </>
          ) : (
            <>
              {existing ? (
                <button type="button" className="btn btn--danger-text" onClick={() => setConfirmingDelete(true)}>
                  <Icon name="trash" />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <span className="car-form__actions">
                <button type="button" className="btn btn--secondary" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save
                </button>
              </span>
            </>
          )}
        </footer>
      </form>
    </Modal>
  );
}
