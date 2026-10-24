import { readFileSync } from "fs";
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDocs, setDoc, setLogLevel, Timestamp } from "firebase/firestore";

export type CarFields = Record<string, unknown>;

/** firestore.rules loaded into the Firestore emulator, acting as a given signed-in user (or nobody). */
export class FirestoreRules {
  private constructor(private readonly env: RulesTestEnvironment) {}

  static async start() {
    // Refused writes are the point of these tests; the SDK would log each one as an error.
    setLogLevel("silent");
    const env = await initializeTestEnvironment({
      projectId: "demo-fuelplan-rules",
      firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    });
    return new FirestoreRules(env);
  }

  /** A valid car, with the timestamps the app writes. */
  static car(fields: CarFields = {}): CarFields {
    const now = Timestamp.now();
    return { name: "Golf VII", fuel: "diesel", consumption: 6.5, color: "#0e8a6d", createdAt: now, updatedAt: now, ...fields };
  }

  private db(asUid: string | null) {
    return (asUid ? this.env.authenticatedContext(asUid) : this.env.unauthenticatedContext()).firestore();
  }

  saveCar(asUid: string | null, ownerUid: string, car: CarFields) {
    return setDoc(doc(this.db(asUid), "users", ownerUid, "cars", "car-1"), car);
  }

  async countCars(asUid: string | null, ownerUid: string) {
    return (await getDocs(collection(this.db(asUid), "users", ownerUid, "cars"))).size;
  }

  deleteCar(asUid: string | null, ownerUid: string) {
    return deleteDoc(doc(this.db(asUid), "users", ownerUid, "cars", "car-1"));
  }

  saveUser(asUid: string | null, ownerUid: string, fields: CarFields) {
    return setDoc(doc(this.db(asUid), "users", ownerUid), fields);
  }

  async clear() {
    await this.env.clearFirestore();
  }

  async stop() {
    await this.env.cleanup();
  }
}
