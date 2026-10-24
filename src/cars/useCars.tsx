import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../toast/toast";
import * as repository from "./carRepository";
import { Car, CarDraft } from "./carRepository";

export const MAX_CARS = 20;

export type SyncStatus = "synced" | "saving" | "offline";
// The car being edited (null while adding one). `useForTrip`: added from the trip's car picker,
// so the trip switches to it once saved.
type Editor = { car: Car | null; useForTrip: boolean };

type CarsContextValue = {
  cars: Car[];
  loaded: boolean;
  defaultCarId: string | null;
  syncStatus: SyncStatus;
  // The car the trip uses; null means "Custom values".
  selectedCar: Car | null;
  selectCar: (id: string | null) => void;
  saveCar: (id: string | null, car: CarDraft, makeDefault: boolean) => string;
  deleteCar: (id: string) => void;
  editor: Editor | null;
  openEditor: (car: Car | null, options?: { useForTrip?: boolean }) => void;
  closeEditor: () => void;
};

const CarsContext = createContext<CarsContextValue | null>(null);

export function useCars() {
  const value = useContext(CarsContext);
  if (!value) throw new Error("useCars must be used inside <CarsProvider>");
  return value;
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/** The signed-in user's saved cars, live from Firestore, and the car the trip uses. */
export function CarsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const showToast = useToast();
  const online = useOnline();

  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoaded, setCarsLoaded] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [storedDefaultId, setStoredDefaultId] = useState<string | null>(null);
  const [defaultLoaded, setDefaultLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    setCars([]);
    setCarsLoaded(false);
    setStoredDefaultId(null);
    setDefaultLoaded(false);
    setSelectedId(null);
    setEditor(null);
    if (!uid) return;
    // Right after signing in, the (empty) local cache answers first; wait for the server
    // unless the cache already has cars, so the default car isn't picked from an empty list.
    const stopCars = repository.subscribeToCars(uid, (snapshot) => {
      setCars(snapshot.cars);
      setPendingWrites(snapshot.pendingWrites);
      if (!snapshot.fromCache || snapshot.cars.length > 0) setCarsLoaded(true);
    });
    const stopDefault = repository.subscribeToDefaultCar(uid, (id, confirmed) => {
      setStoredDefaultId(id);
      if (confirmed) setDefaultLoaded(true);
    });
    return () => {
      stopCars();
      stopDefault();
    };
  }, [uid]);

  const loaded = carsLoaded && defaultLoaded;
  // Exactly one car is the default: a missing or stale id falls back to the first car.
  const defaultCarId = cars.some((car) => car.id === storedDefaultId) ? storedDefaultId : cars[0]?.id ?? null;

  // The default car is selected once the account's cars have loaded.
  const autoSelectedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || !loaded || autoSelectedFor.current === uid) return;
    autoSelectedFor.current = uid;
    setSelectedId(defaultCarId);
  }, [uid, loaded, defaultCarId]);
  useEffect(() => {
    if (!uid) autoSelectedFor.current = null;
  }, [uid]);

  // A deleted car (or signing out) leaves the trip on Custom values, which keep that car's numbers.
  const selectedCar = cars.find((car) => car.id === selectedId) ?? null;

  const reportFailure = (action: string) => () =>
    showToast(`Couldn't ${action}. Please try again.`, "error");

  const value: CarsContextValue = {
    cars,
    loaded,
    defaultCarId,
    syncStatus: !online ? "offline" : pendingWrites ? "saving" : "synced",
    selectedCar,
    selectCar: setSelectedId,

    saveCar: (id, car, makeDefault) => {
      // The first car is always the default.
      const result = repository.saveCar(uid!, id, car, makeDefault || cars.length === 0);
      result.saved.catch(reportFailure("save the car"));
      return result.id;
    },

    deleteCar: (id) => {
      const nextDefault = id === defaultCarId ? cars.find((car) => car.id !== id)?.id ?? null : undefined;
      repository.deleteCar(uid!, id, nextDefault).catch(reportFailure("delete the car"));
    },

    editor,
    openEditor: (car, options) => {
      if (!car && cars.length >= MAX_CARS) {
        showToast(`You can save up to ${MAX_CARS} cars.`, "error");
        return;
      }
      setEditor({ car, useForTrip: options?.useForTrip ?? false });
    },
    closeEditor: () => setEditor(null),
  };

  return <CarsContext.Provider value={value}>{children}</CarsContext.Provider>;
}
