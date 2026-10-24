import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Starts the Firebase emulators (9099, 8080), the price server (port 3001) and the frontend
 * (port 3000) automatically, or reuses them if they are already running.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    headless: true,
  },

  projects: [
    {
      name: "smoke",
      testMatch: "specs/ui/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "scrape",
      testMatch: "specs/api/**/*.spec.ts",
    },
    {
      name: "rules",
      testMatch: "specs/rules/**/*.spec.ts",
    },
  ],

  webServer: [
    {
      // Firebase Auth + Firestore emulators: accounts and saved cars never touch production in tests.
      command: "npm run emulators",
      url: "http://127.0.0.1:9099",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      cwd: "./server",
      url: "http://localhost:3001/scrape",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        REACT_APP_PROD_SERVER_URL: "http://localhost:3001",
        // A reused dev server must have been started with this too (see the run-dev skill).
        REACT_APP_FIREBASE_EMULATORS: "true",
        BROWSER: "none",
      },
    },
  ],
});
