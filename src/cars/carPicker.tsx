import Icon from "../icons/icon";
import Modal from "../modal/modal";
import { useAuth } from "../auth/useAuth";
import { useView } from "../navigation/useView";
import CarAvatar from "./carAvatar";
import { carDetails } from "./carRepository";
import { useCars } from "./useCars";
import "./cars.css";

type Props = {
  anchor: HTMLElement | null;
  onClose: () => void;
};

/** "Which car are you taking?": a dropdown under the Car row on desktop, a bottom sheet on phones. */
export default function CarPicker({ anchor, onClose }: Props) {
  const { user } = useAuth();
  const { cars, selectedCar, selectCar, openEditor } = useCars();
  const { setView } = useView();

  const options = [
    ...cars.map((car) => ({ id: car.id, color: car.color, name: car.name, details: carDetails(car) })),
    { id: null, color: null, name: "Custom values", details: "Enter consumption and fuel by hand" },
  ];
  const selectedId = selectedCar?.id ?? null;

  const choose = (id: string | null) => {
    selectCar(id);
    onClose();
  };
  const goTo = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Modal title="Which car are you taking?" onClose={onClose} variant="dropdown" anchor={anchor}>
      <ul className="pick-list" role="radiogroup" aria-label="Car">
        {options.map((option) => (
          <li key={option.id ?? "custom"}>
            <button
              type="button"
              className="pick"
              role="radio"
              aria-checked={option.id === selectedId}
              data-autofocus={option.id === selectedId || undefined}
              onClick={() => choose(option.id)}
            >
              <CarAvatar color={option.color} />
              <span className="car-main">
                <span className="car-name">{option.name}</span>
                <span className="car-meta">{option.details}</span>
              </span>
              {option.id === selectedId && <Icon name="check" className="pick-check" />}
            </button>
          </li>
        ))}
      </ul>
      <footer className="pick-foot">
        {user ? (
          <>
            <button type="button" className="link" onClick={goTo(() => openEditor(null, { useForTrip: true }))}>
              <Icon name="plus" />
              New car
            </button>
            <button type="button" className="link" onClick={goTo(() => setView("cars"))}>
              Manage cars
            </button>
          </>
        ) : (
          <button type="button" className="link" onClick={goTo(() => setView("cars"))}>
            <Icon name="user" />
            Sign in and save your cars
          </button>
        )}
      </footer>
    </Modal>
  );
}
