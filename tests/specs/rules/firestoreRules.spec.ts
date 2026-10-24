import { test, expect } from "../../fixtures";
import { FirestoreRules } from "../../api/firestoreRules";
import { INVALID_CAR_FIELDS, OWNER_UID, STRANGER_UID } from "../../data/storedCars";

const DENIED = { code: "permission-denied" };

test.describe("Firestore security rules for saved cars", () => {
  test("the owner can save, read and delete their cars", async ({ rules }) => {
    await test.step(`Expect ${OWNER_UID} to save a valid car in their own account`, async () => {
      await expect(rules.saveCar(OWNER_UID, OWNER_UID, FirestoreRules.car())).resolves.toBeUndefined();
    });

    await test.step(`Expect ${OWNER_UID} to read back 1 car`, async () => {
      expect(await rules.countCars(OWNER_UID, OWNER_UID)).toBe(1);
    });

    await test.step(`Expect ${OWNER_UID} to delete it`, async () => {
      await expect(rules.deleteCar(OWNER_UID, OWNER_UID)).resolves.toBeUndefined();
    });
  });

  test("nobody else can read, write or delete someone's cars", async ({ rules }) => {
    await test.step(`Save a car as ${OWNER_UID}`, async () => {
      await rules.saveCar(OWNER_UID, OWNER_UID, FirestoreRules.car());
    });

    await test.step(`Expect another user (${STRANGER_UID}) to be refused reading, writing and deleting it`, async () => {
      await expect(rules.countCars(STRANGER_UID, OWNER_UID)).rejects.toMatchObject(DENIED);
      await expect(rules.saveCar(STRANGER_UID, OWNER_UID, FirestoreRules.car())).rejects.toMatchObject(DENIED);
      await expect(rules.deleteCar(STRANGER_UID, OWNER_UID)).rejects.toMatchObject(DENIED);
    });

    await test.step("Expect a signed-out visitor to be refused too", async () => {
      await expect(rules.countCars(null, OWNER_UID)).rejects.toMatchObject(DENIED);
      await expect(rules.saveCar(null, OWNER_UID, FirestoreRules.car())).rejects.toMatchObject(DENIED);
    });
  });

  for (const invalid of INVALID_CAR_FIELDS) {
    test(`a car with ${invalid.what} is refused`, async ({ rules }) => {
      await test.step(`Expect the owner's car with ${invalid.what} to be refused`, async () => {
        await expect(rules.saveCar(OWNER_UID, OWNER_UID, FirestoreRules.car(invalid.fields))).rejects.toMatchObject(
          DENIED
        );
      });
    });
  }

  test("the account document holds only the default car", async ({ rules }) => {
    await test.step("Expect the owner to set defaultCarId to a car id, and back to null", async () => {
      await expect(rules.saveUser(OWNER_UID, OWNER_UID, { defaultCarId: "car-1" })).resolves.toBeUndefined();
      await expect(rules.saveUser(OWNER_UID, OWNER_UID, { defaultCarId: null })).resolves.toBeUndefined();
    });

    await test.step("Expect personal data such as an email to be refused (it stays in Firebase Auth)", async () => {
      await expect(
        rules.saveUser(OWNER_UID, OWNER_UID, { defaultCarId: null, email: "anna@example.com" })
      ).rejects.toMatchObject(DENIED);
    });

    await test.step(`Expect ${STRANGER_UID} to be refused changing someone else's default car`, async () => {
      await expect(rules.saveUser(STRANGER_UID, OWNER_UID, { defaultCarId: "car-1" })).rejects.toMatchObject(DENIED);
    });
  });
});
