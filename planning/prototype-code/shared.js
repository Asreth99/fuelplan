/*
 * Shared by the three direction mocks: icon sprite, stylised map, and live cost logic.
 * Prototype code only — not part of the app.
 */

/* ---------- Icon set: 24px grid, 1.75px round stroke, currentColor ---------- */
const ICONS = {
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  swap: '<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>',
  locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  fuel: '<path d="M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M3 20h12M6.5 8h5M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  car: '<path d="M3 17v-4.5l2.2-5A2 2 0 0 1 7 6.3h10a2 2 0 0 1 1.8 1.2l2.2 5V17zM3 12.5h18M5 17v2m14-2v2"/><circle cx="7" cy="14.8" r=".6"/><circle cx="17" cy="14.8" r=".6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
  toll: '<path d="M3 9h18v4H3zM6 9l3 4m2-4 3 4m2-4 3 4M5 13v7m14-7v7"/>',
  highway: '<path d="M8 3 5 21M16 3l3 18M12 4v2m0 4v3m0 4v3"/>',
  ferry: '<path d="M3 18c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M5 15l-1-4h16l-1 4M8 11V7h8v4M12 7V4"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.9 7.6-4.4m-7.6 6.6 7.6 4.4"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4m5 0v4l3 2"/>',
  settings: '<path d="M4 6h10m4 0h2M4 12h4m4 0h8M4 18h12m4 0h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  drag: '<circle cx="9" cy="7" r=".8"/><circle cx="15" cy="7" r=".8"/><circle cx="9" cy="12" r=".8"/><circle cx="15" cy="12" r=".8"/><circle cx="9" cy="17" r=".8"/><circle cx="15" cy="17" r=".8"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zm0 0v13m6-10.5v13"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
};

function injectIconSprite() {
  const symbols = Object.entries(ICONS)
    .map(([name, body]) => `<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`)
    .join("");
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>`
  );
  // <i data-icon="car"></i>  ->  inline SVG using the sprite
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.outerHTML = `<svg class="ic ${el.className}" aria-hidden="true"><use href="#i-${el.dataset.icon}"/></svg>`;
  });
}

/* ---------- Stylised map (no Google key needed) ---------- */
// Deterministic pseudo-random so every reload looks the same.
function seeded(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function renderMap(container, getFreeArea) {
  const draw = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const free = getFreeArea(w, h);
    const rnd = seeded(7);

    const minorRoads = Array.from({ length: 34 }, () => {
      const vertical = rnd() > 0.5;
      const p = rnd();
      const bend = (rnd() - 0.5) * 120;
      return vertical
        ? `M${p * w} -20 Q${p * w + bend} ${h / 2} ${p * w + bend / 3} ${h + 20}`
        : `M-20 ${p * h} Q${w / 2} ${p * h + bend} ${w + 20} ${p * h - bend / 3}`;
    }).join(" ");

    const parks = Array.from({ length: 7 }, () => {
      const cx = rnd() * w, cy = rnd() * h, r = 30 + rnd() * 70;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.4}" ry="${r}" class="m-park"/>`;
    }).join("");

    const river = `M${w * 0.62} -20 C${w * 0.5} ${h * 0.25}, ${w * 0.75} ${h * 0.45}, ${w * 0.58} ${h * 0.7} S${w * 0.7} ${h + 20}, ${w * 0.66} ${h + 20}`;

    // Route sits inside the area not covered by the panel / sheet.
    const pt = (fx, fy) => [free.left + fx * (free.right - free.left), free.top + fy * (free.bottom - free.top)];
    const [sx, sy] = pt(0.12, 0.78);
    const [mx, my] = pt(0.48, 0.45);
    const [ex, ey] = pt(0.88, 0.2);
    const route = `M${sx} ${sy} C${sx + 60} ${sy - 10}, ${mx - 90} ${my + 50}, ${mx} ${my} S${ex - 70} ${ey + 40}, ${ex} ${ey}`;
    const motorway = `M-20 ${sy + 30} C${w * 0.3} ${sy}, ${mx - 40} ${my + 30}, ${mx + 30} ${my - 5} S${w * 0.85} ${ey - 30}, ${w + 20} ${ey - 60}`;

    container.innerHTML = `
      <svg class="map-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" class="m-land"/>
        ${parks}
        <path d="${river}" class="m-water"/>
        <path d="${minorRoads}" class="m-road"/>
        <path d="${motorway}" class="m-major-casing"/><path d="${motorway}" class="m-major"/>
        <path d="${route}" class="m-route-casing"/><path d="${route}" class="m-route"/>
        <circle cx="${sx}" cy="${sy}" r="7" class="m-start"/>
        <circle cx="${mx}" cy="${my}" r="6" class="m-stop"/>
        <g transform="translate(${ex - 14} ${ey - 34})" class="m-end"><path d="M14 34s-12-11-12-20a12 12 0 0 1 24 0c0 9-12 20-12 20z"/><circle cx="14" cy="14" r="4.5" class="m-end-dot"/></g>
        <text x="${sx + 14}" y="${sy + 22}" class="m-label">Budapest</text>
        <text x="${mx + 12}" y="${my + 20}" class="m-label">Szolnok</text>
        <text x="${ex + 18}" y="${ey + 4}" class="m-label">Debrecen</text>
        <g transform="translate(${Math.max(free.left - 20, (sx + mx) / 2 - 130)} ${(sy + my) / 2 - 56})" class="m-bubble">
          <rect width="104" height="40" rx="12"/><text x="52" y="17" class="m-bubble-t1">2 ó 25 p</text><text x="52" y="32" class="m-bubble-t2">231 km</text>
        </g>
      </svg>`;
  };
  draw();
  new ResizeObserver(draw).observe(container);
  window.addEventListener("resize", draw);
}

/* ---------- Live cost logic (real formula, mock trip) ---------- */
const TRIP = { distanceKm: 231, consumption: 6.5, pricePerLiter: 709.4 };
const huf = (n) => `${Math.round(n).toLocaleString("hu-HU")} Ft`;

function bindTripCard(root = document) {
  const state = { passengers: 2, roundTrip: false };

  const update = () => {
    const liters = (TRIP.distanceKm / 100) * TRIP.consumption * (state.roundTrip ? 2 : 1);
    const total = Math.round(liters * TRIP.pricePerLiter);
    root.querySelectorAll("[data-cost]").forEach((el) => (el.textContent = huf(total)));
    root.querySelectorAll("[data-per-person]").forEach((el) => (el.textContent = huf(total / state.passengers)));
    root.querySelectorAll("[data-passengers]").forEach((el) => (el.textContent = state.passengers));
    root.querySelectorAll("[data-liters]").forEach((el) => (el.textContent = `${liters.toLocaleString("hu-HU", { maximumFractionDigits: 1 })} l`));
    root.querySelectorAll("[data-gauge]").forEach((el) => (el.style.width = `${Math.min(100, (liters / 50) * 100)}%`));
    root.querySelectorAll("[data-trip-toggle] button").forEach((b) =>
      b.setAttribute("aria-pressed", String((b.dataset.value === "round") === state.roundTrip))
    );
  };

  root.querySelectorAll("[data-step]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.passengers = Math.min(9, Math.max(1, state.passengers + Number(btn.dataset.step)));
      update();
    })
  );
  root.querySelectorAll("[data-trip-toggle] button").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.roundTrip = btn.dataset.value === "round";
      update();
    })
  );
  root.querySelectorAll("[data-chip]").forEach((chip) =>
    chip.addEventListener("click", () => chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")))
  );
  update();
  return update; // lets other scripts (e.g. the car picker) refresh the cost after changing TRIP
}

/* ---------- Main navigation (rail on desktop, tab bar on phones) ---------- */
const NAV_ITEMS = {
  plan: { icon: "map", label: "Tervezés" },
  trips: { icon: "history", label: "Utak" },
  cars: { icon: "car", label: "Autók" },
  settings: { icon: "settings", label: "Beállítások" },
};

function navHtml(keys, itemClass, wrap) {
  return keys
    .map((key, index) => {
      const { icon, label } = NAV_ITEMS[key];
      return `<a class="${itemClass}${index === 0 ? " active" : ""}" href="#${key}" data-nav="${key}">${wrap(`<i data-icon="${icon}"></i>`)}${itemClass === "tab" ? label : `<span>${label}</span>`}</a>`;
    })
    .join("");
}

/* ---------- Key screen markup: Plan with a filled trip (HU) ---------- */
const PLAN_SCREEN = `
<div class="app">
  <div class="map" id="map" role="img" aria-label="Térkép: Budapest → Szolnok → Debrecen"></div>

  <nav class="rail" aria-label="Fő navigáció">
    <div class="brand" title="FuelPlan"><i data-icon="fuel"></i></div>
    __RAIL_ITEMS__
    <div class="rail-spacer"></div>
    __RAIL_BOTTOM__
  </nav>

  <div class="panel">
    <section class="route-card" aria-label="Útvonal">
      <header class="route-head">
        <h1 class="title">Útvonal</h1>
        <button class="link-btn"><i data-icon="plus"></i>Megálló</button>
      </header>
      <div class="stops-wrap">
        <ol class="stops">
          <li class="stop"><span class="stop-mark start"></span><input value="Budapest, Keleti pályaudvar" aria-label="Indulás"><button class="icon-btn drag" aria-label="Áthelyezés"><i data-icon="drag"></i></button></li>
          <li class="stop"><span class="stop-mark mid"></span><input value="Szolnok" aria-label="Megálló"><button class="icon-btn drag" aria-label="Megálló törlése"><i data-icon="close"></i></button></li>
          <li class="stop"><span class="stop-mark end"></span><input value="Debrecen, Nagytemplom" aria-label="Érkezés"><button class="icon-btn drag" aria-label="Áthelyezés"><i data-icon="drag"></i></button></li>
        </ol>
        <button class="icon-btn swap" aria-label="Indulás és érkezés felcserélése"><i data-icon="swap"></i></button>
      </div>
      <div class="chips" role="group" aria-label="Kerülendő">
        <span class="chips-label">Kerülendő</span>
        <button class="chip" data-chip aria-pressed="false"><i data-icon="toll"></i>Fizetős</button>
        <button class="chip" data-chip aria-pressed="false"><i data-icon="highway"></i>Autópálya</button>
        <button class="chip" data-chip aria-pressed="true"><i data-icon="ferry"></i>Komp</button>
      </div>
    </section>

    <section class="trip-sheet" aria-label="Út költsége">
      <div class="grabber" aria-hidden="true"></div>
      <div class="summary">
        <span><i data-icon="clock"></i>2 ó 25 p</span>
        <span><i data-icon="route"></i>231 km</span>
        <span><i data-icon="fuel"></i><b data-liters></b></span>
      </div>

      <div class="rows">
        <button class="row" data-car-row aria-haspopup="dialog">
          <span class="row-ic" data-car-icon><i data-icon="car"></i></span>
          <span class="row-main"><span class="row-label">Autó</span><span class="row-value" data-car-value>Golf VII · 6,5 l/100 km · Dízel</span></span>
          <i data-icon="chevron" class="chev"></i>
        </button>
        <button class="row">
          <span class="row-ic"><i data-icon="fuel"></i></span>
          <span class="row-main"><span class="row-label">Üzemanyagár · mai átlag</span><span class="row-value" data-price-value>709,4 Ft/l</span></span>
          <span class="price-range" data-price-range>676 – 773</span>
          <i data-icon="chevron" class="chev"></i>
        </button>
        <div class="row">
          <span class="row-ic"><i data-icon="people"></i></span>
          <span class="row-main"><span class="row-label">Utasok</span><span class="row-value">Költség megosztása</span></span>
          <div class="stepper">
            <button data-step="-1" aria-label="Kevesebb utas"><i data-icon="minus"></i></button>
            <output data-passengers></output>
            <button data-step="1" aria-label="Több utas"><i data-icon="plus"></i></button>
          </div>
        </div>
      </div>

      <div class="cost">
        <div class="seg" data-trip-toggle role="group" aria-label="Út típusa">
          <button data-value="one">Egy irány</button><button data-value="round">Oda-vissza</button>
        </div>
        <div class="cost-main">
          <span class="cost-label">Üzemanyagköltség</span>
          <strong class="cost-value" data-cost></strong>
          <span class="cost-pp"><b data-per-person></b> / fő</span>
        </div>
        <div class="gauge"><div class="gauge-bar"><span data-gauge></span></div><span class="gauge-text"><b data-liters></b> egy 50 l-es tankból</span></div>
        <div class="cost-actions">
          <button class="btn secondary"><i data-icon="star"></i>Mentés</button>
          <button class="btn primary"><i data-icon="share"></i>Megosztás</button>
        </div>
      </div>
    </section>
  </div>

  <button class="locate" aria-label="Saját hely megkeresése"><span class="halo"><span class="dot"></span></span></button>

  <nav class="tabbar" aria-label="Fő navigáció">
    __TAB_ITEMS__
  </nav>
</div>`;

const MOBILE_MAX = 899;

// The part of the map not covered by the panel (desktop) or the top card and sheet (mobile).
function freeMapArea(w, h) {
  if (window.innerWidth > MOBILE_MAX) {
    // Whichever floating panel is shown (the plan panel, or e.g. the cars list).
    const panel = [...document.querySelectorAll(".panel, .side-view")].find((el) => el.getClientRects().length);
    const panelRight = panel ? panel.getBoundingClientRect().right : 0;
    return { left: panelRight + 40, right: w - 100, top: 70, bottom: h - 70 };
  }
  const top = document.querySelector(".route-card").getBoundingClientRect().bottom + 34;
  const bottom = document.querySelector(".trip-sheet").getBoundingClientRect().top - 24;
  return { left: 34, right: w - 60, top, bottom };
}

/* ---------- Boot ---------- */
// options.nav: which menu items to show (default: the full original plan).
// options.navBottom: items pinned to the bottom of the desktop rail (e.g. the profile) instead of the
// language pill; on phones they are simply the last tabs.
// Returns the trip card's update function.
function bootDirection({ nav = ["plan", "trips", "cars", "settings"], navBottom = [] } = {}) {
  const languagePill = `<div class="lang" role="group" aria-label="Nyelv"><span class="on">HU</span><span>EN</span></div>`;
  const screen = PLAN_SCREEN
    .replace("__RAIL_ITEMS__", navHtml(nav, "rail-item", (icon) => icon))
    .replace("__RAIL_BOTTOM__", navBottom.length ? navHtml(navBottom, "rail-item rail-item--bottom", (icon) => icon).replace(" active", "") : languagePill)
    .replace("__TAB_ITEMS__", navHtml([...nav, ...navBottom], "tab", (icon) => `<span class="pill">${icon}</span>`));
  document.body.insertAdjacentHTML("afterbegin", screen);
  injectIconSprite();
  renderMap(document.getElementById("map"), freeMapArea);
  return bindTripCard();
}
