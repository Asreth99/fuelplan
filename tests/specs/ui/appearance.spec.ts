import { test, expect } from "../../fixtures";

test.describe("Dark mode", () => {
  test.describe("on a device set to dark", () => {
    test.use({ colorScheme: "dark" });

    test("follows the device, and a choice of Light wins and is remembered", async ({ app, menu, profile }) => {
      await test.step("Open FuelPlan", async () => {
        await app.open();
      });

      await test.step("Expect the dark theme, with Appearance on 'System'", async () => {
        await expect(app.document).toHaveClass(/\bdark\b/);
        await menu.openProfile();
        await expect(profile.appearanceOption("System")).toHaveAttribute("aria-pressed", "true");
      });

      await test.step("Choose Light under Appearance (no account needed)", async () => {
        await profile.appearanceOption("Light").click();
      });

      await test.step("Expect the light theme straight away", async () => {
        await expect(app.document).toHaveClass(/\blight\b/);
        await expect(app.document).not.toHaveClass(/\bdark\b/);
      });

      await test.step("Reload the app", async () => {
        await app.reload();
      });

      await test.step("Expect it to stay light, although the device is dark", async () => {
        await expect(app.document).toHaveClass(/\blight\b/);
      });
    });
  });

  test.describe("on a device set to light", () => {
    test.use({ colorScheme: "light" });

    test("can be switched to dark by hand", async ({ app, menu, profile }) => {
      await test.step("Open FuelPlan and go to Profile", async () => {
        await app.open();
        await menu.openProfile();
      });

      await test.step("Expect the light theme", async () => {
        await expect(app.document).toHaveClass(/\blight\b/);
      });

      await test.step("Choose Dark under Appearance", async () => {
        await profile.appearanceOption("Dark").click();
      });

      await test.step("Expect the dark theme, and Dark marked as chosen", async () => {
        await expect(app.document).toHaveClass(/\bdark\b/);
        await expect(profile.appearanceOption("Dark")).toHaveAttribute("aria-pressed", "true");
      });
    });
  });
});
