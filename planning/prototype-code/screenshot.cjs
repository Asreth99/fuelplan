// Captures the planning mocks at phone and desktop size.
// Usage (from the repo root): node planning/prototype-code/screenshot.cjs [filter]
//   filter: only capture outputs whose path contains this text, e.g. "palettes"
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(__dirname, "../../node_modules/playwright"));

const PLANNING = path.join(__dirname, "..");
const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const PAGES = [
  // ?shot hides planning aids (B's palette switcher) in screenshots
  { file: "prototype/direction-a-clean.html", query: "?shot", out: "screenshots/directions/a-clean" },
  { file: "prototype/fuelplan.html", query: "?shot", out: "screenshots/directions/b-bold" },
  { file: "prototype/direction-c-dark.html", query: "?shot", out: "screenshots/directions/c-dark" },
  ...["fuel-green", "petrol-sun", "plum-coral", "violet-mint", "teal-peach", "graphite-orange"].map((palette) => ({
    file: "prototype/fuelplan.html",
    query: `?palette=${palette}&shot`,
    out: `screenshots/palettes/${palette}`,
  })),
  // Saved cars ("Autók") in direction B; cars need a signed-in account
  ...[
    ["list", "?view=cars&auth=signedin"],
    ["empty", "?view=cars&auth=signedin&cars=empty"],
    ["new-car", "?view=cars&auth=signedin&editor=new"],
    ["edit-car", "?view=cars&auth=signedin&editor=golf"],
    ["custom-color", "?view=cars&auth=signedin&editor=new&color=%23ff8fb1"],
    ["picker", "?auth=signedin&picker=open"],
    ["signed-out-gate", "?view=cars&auth=signedout"],
    ["signed-out-picker", "?auth=signedout&picker=open"],
  ].map(([name, query]) => ({ file: "prototype/fuelplan.html", query: `${query}&shot`, out: `screenshots/cars/${name}` })),
  // Profile ("Profil") in direction B
  ...[
    ["signed-out", "?view=profile&auth=signedout"],
    ["email-sent", "?view=profile&auth=signedout&signin=email-sent"],
    ["signed-in", "?view=profile&auth=signedin"],
    ["offline", "?view=profile&auth=signedin&sync=offline"],
    ["delete-account", "?view=profile&auth=signedin&confirm=delete"],
  ].map(([name, query]) => ({ file: "prototype/fuelplan.html", query: `${query}&shot`, out: `screenshots/profile/${name}` })),
];
const filter = process.argv[2] || "";

(async () => {
  const browser = await chromium.launch();
  for (const { file, query = "", out } of PAGES.filter((p) => p.out.includes(filter))) {
    for (const [size, options] of Object.entries(VIEWPORTS)) {
      const page = await (await browser.newContext(options)).newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("file://" + path.join(PLANNING, file).replace(/\\/g, "/") + query);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const target = path.join(PLANNING, `${out}-${size}.png`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await page.screenshot({ path: target });
      console.log(`${errors.length ? "ERR" : "ok "} ${path.relative(PLANNING, target)}${errors.length ? "  " + errors.join(" | ") : ""}`);
      await page.context().close();
    }
  }
  await browser.close();
})();
