import Icon from "../icons/icon";
import { useAuth } from "../auth/useAuth";
import SignInPanel from "../auth/signInPanel";
import CarAvatar from "./carAvatar";
import { carDetails } from "./carRepository";
import { useCars } from "./useCars";
import "./cars.css";

/** "My cars": the signed-in user's saved cars. Tapping a tile edits the car. */
export default function CarsView() {
  const { available, ready, user } = useAuth();
  const { cars, loaded, defaultCarId, openEditor } = useCars();

  if (!available) return <p className="cars-loading">Saved cars aren't available right now.</p>;
  if (ready && !user) {
    return (
      <>
        <h1 className="cars-head__title">My cars</h1>
        <SignInPanel
          heading="Sign in to save your cars"
          text="Your cars are stored in your account, so they're on all your devices and never lost. You can plan routes without signing in."
        />
      </>
    );
  }
  if (!loaded) return <p className="cars-loading">Loading your cars…</p>;

  return (
    <>
      <header className="cars-head">
        <div>
          <h1 className="cars-head__title">My cars</h1>
          <p className="cars-head__sub">
            {cars.length
              ? `${cars.length} saved ${cars.length === 1 ? "car" : "cars"}`
              : "Save your cars and use them with one tap."}
          </p>
        </div>
        {cars.length > 0 && (
          <button type="button" className="btn btn--primary" onClick={() => openEditor(null)}>
            <Icon name="plus" />
            New car
          </button>
        )}
      </header>

      {cars.length ? (
        <ul className="car-list" aria-label="Saved cars">
          {cars.map((car) => (
            <li key={car.id}>
              <button type="button" className="car-tile" aria-label={`Edit ${car.name}`} onClick={() => openEditor(car)}>
                <CarAvatar color={car.color} />
                <span className="car-main">
                  <span className="car-name">{car.name}</span>
                  <span className="car-meta">{carDetails(car)}</span>
                </span>
                {car.id === defaultCarId && <span className="car-badge">Default</span>}
                <Icon name="edit" className="car-tile__edit" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cars-empty">
          <span className="cars-empty__art">
            <Icon name="car" />
          </span>
          <h2>No saved cars yet</h2>
          <p>Enter the consumption and fuel once, then just pick the car when you plan a route.</p>
          <button type="button" className="btn btn--primary" onClick={() => openEditor(null)}>
            <Icon name="plus" />
            Add a car
          </button>
        </div>
      )}

      <p className="cars-note">
        <Icon name="cloudCheck" />
        Your cars are in your account, on all your devices.
      </p>
    </>
  );
}
