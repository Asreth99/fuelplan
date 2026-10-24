import { test, expect } from "../../fixtures";

test.describe("Editing the list of places on desktop", () => {
  test.beforeEach(async ({ app, routeSearch }) => {
    await test.step("Open FuelPlan and add two stops, leaving them empty (start, stop 1, stop 2, destination)", async () => {
      await app.open();
      await routeSearch.addStopButton.click();
      await routeSearch.addStopButton.click();
      await expect(routeSearch.placeFields).toHaveCount(4);
    });
  });

  test("empty stops can be removed, and every row keeps its own role", async ({ routeSearch, pageErrors }) => {
    await test.step("Press the ✕ next to the first stop", async () => {
      await routeSearch.removeStop("Stop 1");
    });

    await test.step("Expect three fields: start, one stop and the destination, each with its own placeholder", async () => {
      await expect(routeSearch.placeFields).toHaveCount(3);
      await expect(routeSearch.start).toHaveAttribute("placeholder", "Choose starting point");
      await expect(routeSearch.field("Stop 1")).toHaveAttribute("placeholder", "Add a stop");
      await expect(routeSearch.destination).toHaveAttribute("placeholder", "Where to?");
    });

    await test.step("Press the ✕ next to the remaining stop", async () => {
      await routeSearch.removeStop("Stop 1");
    });

    await test.step("Expect just the start and the destination, with no ✕ left and no error", async () => {
      await expect(routeSearch.placeFields).toHaveCount(2);
      await expect(routeSearch.removeButtons).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  });

  test("an empty stop can be dragged to a new position", async ({ routeSearch, pageErrors }) => {
    await test.step("Type 'Szeged' into the second stop without picking a suggestion", async () => {
      await routeSearch.field("Stop 2").fill("Szeged");
    });

    await test.step("Drag the second stop by its handle onto the first stop's position", async () => {
      await routeSearch.moveStop("Stop 2", "Stop 1");
    });

    await test.step("Expect the typed text to have moved up to the first stop, with all four rows intact and no error", async () => {
      await expect(routeSearch.field("Stop 1")).toHaveValue("Szeged");
      await expect(routeSearch.field("Stop 2")).toHaveValue("");
      await expect(routeSearch.placeFields).toHaveCount(4);
      expect(pageErrors).toEqual([]);
    });
  });
});
