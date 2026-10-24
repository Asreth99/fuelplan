import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase";

// Firestore storage of saved cars: users/{uid}/cars/{carId} and users/{uid}.defaultCarId.
// The limits mirror firestore.rules, so users get friendly messages instead of permission errors.

export type FuelKind = "petrol95" | "diesel";

export type Car = {
  id: string;
  name: string;
  fuel: FuelKind;
  consumption: number;
  color: string;
};

export type CarDraft = Omit<Car, "id">;

export const FUEL_LABELS: Record<FuelKind, string> = { petrol95: "95 Petrol", diesel: "Diesel" };
export const CAR_COLORS = ["#0e8a6d", "#1f6feb", "#e8553d", "#f2a33a", "#6a4cf5", "#3f4a4f"];
export const MAX_NAME_LENGTH = 30;
export const MIN_CONSUMPTION = 1;
export const MAX_CONSUMPTION = 40;

export const formatConsumption = (consumption: number) =>
  consumption.toLocaleString("en-GB", { maximumFractionDigits: 1 });

// "6.5 L/100 km · Diesel"
export const carDetails = (car: { consumption: number; fuel: FuelKind }) =>
  `${formatConsumption(car.consumption)} L/100 km · ${FUEL_LABELS[car.fuel]}`;

export function validateCar(car: { name: string; consumption: number }) {
  const errors: { name?: string; consumption?: string } = {};
  if (!car.name.trim()) errors.name = "Give the car a name.";
  if (!(car.consumption >= MIN_CONSUMPTION && car.consumption <= MAX_CONSUMPTION))
    errors.consumption = `Enter a value between ${MIN_CONSUMPTION} and ${MAX_CONSUMPTION} L/100 km.`;
  return errors;
}

const db = () => {
  const instance = firestore();
  if (!instance) throw new Error("Accounts are not configured");
  return instance;
};
const userDoc = (uid: string) => doc(db(), "users", uid);
const carsCollection = (uid: string) => collection(db(), "users", uid, "cars");

export type CarsSnapshot = { cars: Car[]; pendingWrites: boolean; fromCache: boolean };

export function subscribeToCars(uid: string, onChange: (snapshot: CarsSnapshot) => void) {
  return onSnapshot(
    query(carsCollection(uid), orderBy("createdAt")),
    { includeMetadataChanges: true },
    (snapshot) =>
      onChange({
        cars: snapshot.docs.map((d) => {
          const { name, fuel, consumption, color } = d.data();
          return { id: d.id, name, fuel, consumption, color };
        }),
        pendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
      })
  );
}

// `confirmed` is false while only an empty local cache has answered.
export function subscribeToDefaultCar(uid: string, onChange: (defaultCarId: string | null, confirmed: boolean) => void) {
  return onSnapshot(userDoc(uid), (snapshot) =>
    onChange(snapshot.data()?.defaultCarId ?? null, snapshot.exists() || !snapshot.metadata.fromCache)
  );
}

// Writes are applied to the local cache at once (and work offline); the promise settles when the
// server confirms, so callers don't wait for it before closing a dialog.
// Client timestamps keep the list ordered while a write is still offline.
export function saveCar(uid: string, id: string | null, car: CarDraft, makeDefault: boolean) {
  const batch = writeBatch(db());
  const now = Timestamp.now();
  const ref = id ? doc(carsCollection(uid), id) : doc(carsCollection(uid));
  const fields = { ...car, name: car.name.trim(), updatedAt: now };
  if (id) batch.update(ref, fields);
  else batch.set(ref, { ...fields, createdAt: now });
  if (makeDefault) batch.set(userDoc(uid), { defaultCarId: ref.id }, { merge: true });
  return { id: ref.id, saved: batch.commit() };
}

export function deleteCar(uid: string, id: string, nextDefaultCarId: string | null | undefined) {
  const batch = writeBatch(db());
  batch.delete(doc(carsCollection(uid), id));
  if (nextDefaultCarId !== undefined) batch.set(userDoc(uid), { defaultCarId: nextDefaultCarId }, { merge: true });
  return batch.commit();
}

export async function deleteAllUserData(uid: string) {
  const cars = await getDocs(carsCollection(uid));
  const batch = writeBatch(db());
  cars.forEach((car) => batch.delete(car.ref));
  batch.delete(userDoc(uid));
  await batch.commit();
}
