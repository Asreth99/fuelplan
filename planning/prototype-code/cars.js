/*
 * "Autók" (saved cars) for the B direction mock: the cars list, add/edit/delete, and the car
 * picker in the trip card. Cars belong to the signed-in account (CloudStore, see account.js);
 * signed out, the Cars screen asks the user to sign in. Prototype code only.
 *
 * URL options (for screenshots and direct links):
 *   ?cars=empty         the signed-in account has no cars yet (empty state)
 *   ?editor=new|<id>    open the add/edit form
 *   ?color=%23rrggbb    preset a custom colour in the form
 *   ?picker=open        open the car picker of the trip card
 */

Object.assign(ICONS, {
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  custom: '<path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
});

// Today's averages from the price server (fuelPrices / holtankoljak.hu).
const FUELS = {
  petrol95: { label: "95 benzin", price: 645.3, range: "597 – 705" },
  diesel: { label: "Dízel", price: 709.4, range: "676 – 773" },
};
const CAR_COLORS = ["#0e8a6d", "#1f6feb", "#e8553d", "#f2a33a", "#6a4cf5", "#3f4a4f"];

const num = (n) => n.toLocaleString("hu-HU", { maximumFractionDigits: 1 });
const carMeta = (car) => `${num(car.consumption)} l/100 km · ${FUELS[car.fuel].label}`;

// Any colour can be chosen, so the car icon switches to dark on light colours to stay visible.
function iconColorOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#0a3d33" : "#ffffff";
}
const avatarStyle = (color) => `background:${color};color:${iconColorOn(color)}`;
// icon(), escapeHtml(), Views, Modal and Toast come from views.js; Account and CloudStore from account.js.

function bootCars(updateTrip) {
  const params = new URLSearchParams(location.search);

  /* ---------- State: the signed-in account's cars ---------- */
  const load = () => (!Account.user || params.get("cars") === "empty" ? [] : CloudStore.load(Account.user));
  let cars = load();
  const save = () => {
    if (params.get("cars") !== "empty") CloudStore.save(Account.user, cars);
  };
  const defaultCar = () => cars.find((car) => car.isDefault) || cars[0];
  // The car used for the trip: the default one, or "custom" values when there are no cars.
  let selectedId = defaultCar()?.id ?? "custom";
  let customValues = { fuel: "diesel", consumption: 6.5 };

  // Signing in brings the account's cars (and its default car); signing out leaves custom values.
  Account.onChange(() => {
    const previous = cars.find((c) => c.id === selectedId);
    if (previous) customValues = { fuel: previous.fuel, consumption: previous.consumption };
    cars = load();
    selectedId = defaultCar()?.id ?? "custom";
    applySelection();
  });

  /* ---------- Trip card: the "Autó" row drives consumption, fuel and price ---------- */
  const applySelection = () => {
    const car = cars.find((c) => c.id === selectedId);
    const values = car || customValues;
    TRIP.consumption = values.consumption;
    TRIP.pricePerLiter = FUELS[values.fuel].price;
    document.querySelectorAll("[data-car-value]").forEach((el) => {
      el.textContent = car ? `${car.name} · ${carMeta(car)}` : `Egyéni · ${carMeta(values)}`;
    });
    document.querySelectorAll("[data-car-icon]").forEach((el) => {
      el.style.background = car ? car.color : "";
      el.style.color = car ? iconColorOn(car.color) : "";
      el.innerHTML = icon(car ? "car" : "custom");
    });
    document.querySelectorAll("[data-price-value]").forEach((el) => (el.textContent = `${num(FUELS[values.fuel].price)} Ft/l`));
    document.querySelectorAll("[data-price-range]").forEach((el) => (el.textContent = FUELS[values.fuel].range));
    updateTrip();
  };

  /* ---------- The cars screen ---------- */
  const carsView = Views.addPanel("cars", "Autóim");

  const renderCarsView = () => {
    if (!Account.user) {
      carsView.innerHTML = `
        <header class="cars-head"><div><h1 class="cars-title">Autóim</h1></div></header>
        ${signInPanelHtml({
          heading: "Jelentkezz be az autóid mentéséhez",
          text: "Az autóid a fiókodban tárolódnak, így minden eszközödön elérhetők, és nem vesznek el. Útvonalat belépés nélkül is tervezhetsz.",
        })}`;
      bindSignInPanel(carsView);
      return;
    }

    carsView.innerHTML = `
      <header class="cars-head">
        <div>
          <h1 class="cars-title">Autóim</h1>
          <p class="cars-sub">${cars.length ? `${cars.length} mentett autó` : "Mentsd el az autóidat, és egy koppintással számolj velük."}</p>
        </div>
        ${cars.length ? `<button class="btn primary cars-add" data-new-car>${icon("plus")}Új autó</button>` : ""}
      </header>
      ${
        cars.length
          ? `<ul class="car-list">${cars.map((car) => `
              <li>
                <button class="car-tile" data-edit-car="${car.id}" aria-label="${escapeHtml(car.name)} szerkesztése">
                  <span class="car-avatar" style="${avatarStyle(car.color)}">${icon("car")}</span>
                  <span class="car-main">
                    <span class="car-name">${escapeHtml(car.name)}</span>
                    <span class="car-meta">${carMeta(car)}</span>
                  </span>
                  ${car.isDefault ? `<span class="car-badge">Alapértelmezett</span>` : ""}
                  ${icon("edit", "car-edit-ic")}
                </button>
              </li>`).join("")}
            </ul>`
          : `<div class="cars-empty">
              <span class="cars-empty-art">${icon("car")}</span>
              <h2>Még nincs mentett autód</h2>
              <p>Add meg egyszer a fogyasztást és az üzemanyagot, utána csak kiválasztod az útvonalnál.</p>
              <button class="btn primary" data-new-car>${icon("plus")}Autó hozzáadása</button>
            </div>`
      }
      <p class="cars-note">${icon("cloud-check")}Az autóid a fiókodban vannak: minden eszközödön elérhetők.</p>`;
    carsView.querySelectorAll("[data-new-car]").forEach((b) => b.addEventListener("click", () => openEditor()));
    carsView.querySelectorAll("[data-edit-car]").forEach((b) => b.addEventListener("click", () => openEditor(b.dataset.editCar)));
  };
  Views.register("cars", renderCarsView);

  /* ---------- Add / edit a car ---------- */
  const openEditor = (id) => {
    if (!Account.user) return Views.show("cars"); // saving cars needs an account
    const existing = cars.find((car) => car.id === id);
    const draft = existing
      ? { ...existing }
      : { name: "", fuel: "diesel", consumption: "", color: CAR_COLORS[cars.length % CAR_COLORS.length], isDefault: cars.length === 0 };
    if (params.get("color")) draft.color = params.get("color"); // screenshots of a custom colour
    const hasCustomColor = !CAR_COLORS.includes(draft.color);

    const modal = Modal.open(`
      <form class="car-form" novalidate>
        <header class="modal-head">
          <h2>${existing ? "Autó szerkesztése" : "Új autó"}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Bezárás">${icon("close")}</button>
        </header>

        <label class="field">
          <span class="field-label">Név</span>
          <input name="name" maxlength="30" placeholder="pl. Családi Golf" value="${escapeHtml(draft.name)}" autocomplete="off">
          <span class="field-error" data-error="name"></span>
        </label>

        <div class="field">
          <span class="field-label" id="fuel-label">Üzemanyag</span>
          <div class="seg" role="radiogroup" aria-labelledby="fuel-label">
            ${Object.entries(FUELS).map(([key, fuel]) =>
              `<button type="button" role="radio" data-fuel="${key}" aria-checked="${draft.fuel === key}" aria-pressed="${draft.fuel === key}">${fuel.label}</button>`).join("")}
          </div>
        </div>

        <label class="field">
          <span class="field-label">Átlagos fogyasztás</span>
          <span class="field-input">
            <input name="consumption" inputmode="decimal" placeholder="pl. 6,5" value="${draft.consumption === "" ? "" : num(draft.consumption)}" autocomplete="off">
            <span class="field-unit">l/100 km</span>
          </span>
          <span class="field-hint">A fedélzeti számítógépről vagy a forgalmi adatokból.</span>
          <span class="field-error" data-error="consumption"></span>
        </label>

        <div class="field">
          <span class="field-label" id="color-label">Szín</span>
          <div class="swatches" role="radiogroup" aria-labelledby="color-label">
            ${CAR_COLORS.map((color) =>
              `<button type="button" role="radio" class="swatch" data-color="${color}" style="--swatch:${color}" aria-checked="${draft.color === color}" aria-label="Szín ${color}"></button>`).join("")}
            <!-- Last option: any colour, through the system colour picker (RGB/HSL/HEX on desktop, colour sheet on phones) -->
            <label class="swatch swatch--custom" role="radio" aria-checked="${hasCustomColor}" data-custom-swatch
              style="--swatch:${hasCustomColor ? draft.color : "transparent"}" title="Egyéni szín">
              <input type="color" value="${hasCustomColor ? draft.color : "#ff8fb1"}" aria-label="Egyéni szín választása" data-custom-color>
            </label>
          </div>
        </div>

        <label class="switch-row">
          <span><b>Alapértelmezett autó</b><small>Ezzel számolunk, amikor megnyitod az appot.</small></span>
          <input type="checkbox" name="isDefault" role="switch" ${draft.isDefault ? "checked" : ""}>
          <span class="switch" aria-hidden="true"></span>
        </label>

        <footer class="modal-foot" data-foot>
          ${existing ? `<button type="button" class="btn danger-text" data-delete>${icon("trash")}Törlés</button>` : "<span></span>"}
          <span class="modal-actions">
            <button type="button" class="btn secondary" data-close>Mégse</button>
            <button type="submit" class="btn primary">Mentés</button>
          </span>
        </footer>
      </form>`, existing ? "Autó szerkesztése" : "Új autó", "editor");

    const form = modal.querySelector("form");
    // Looked up explicitly: form.name is the form's own name attribute, not the "name" input.
    const inputs = {
      name: form.querySelector('[name="name"]'),
      consumption: form.querySelector('[name="consumption"]'),
      isDefault: form.querySelector('[name="isDefault"]'),
    };
    inputs.name.focus();
    modal.querySelectorAll("[data-fuel]").forEach((b) =>
      b.addEventListener("click", () => {
        draft.fuel = b.dataset.fuel;
        modal.querySelectorAll("[data-fuel]").forEach((x) => {
          x.setAttribute("aria-checked", String(x === b));
          x.setAttribute("aria-pressed", String(x === b));
        });
      })
    );
    const customSwatch = modal.querySelector("[data-custom-swatch]");
    const customColor = modal.querySelector("[data-custom-color]");
    const selectColor = (color, chosenSwatch) => {
      draft.color = color;
      modal.querySelectorAll("[data-color], [data-custom-swatch]").forEach((x) => x.setAttribute("aria-checked", String(x === chosenSwatch)));
    };
    // "input" fires while dragging in the picker, so the swatch follows live.
    customColor.addEventListener("input", () => {
      customSwatch.style.setProperty("--swatch", customColor.value);
      selectColor(customColor.value, customSwatch);
    });
    modal.querySelectorAll("[data-color]").forEach((b) => b.addEventListener("click", () => selectColor(b.dataset.color, b)));
    // Only digits and one decimal separator, as in the app's other number fields.
    inputs.consumption.addEventListener("input", () => {
      const cleaned = inputs.consumption.value.replace(/[^\d.,]/g, "");
      const sep = cleaned.search(/[.,]/);
      inputs.consumption.value = sep < 0 ? cleaned : cleaned.slice(0, sep + 1) + cleaned.slice(sep + 1).replace(/[.,]/g, "");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = inputs.name.value.trim();
      const consumption = Number(inputs.consumption.value.replace(",", "."));
      const errors = {
        name: name ? "" : "Adj nevet az autónak.",
        consumption: consumption >= 1 && consumption <= 40 ? "" : "1 és 40 l/100 km közötti értéket adj meg.",
      };
      Object.entries(errors).forEach(([field, message]) => {
        modal.querySelector(`[data-error="${field}"]`).textContent = message;
        inputs[field].setAttribute("aria-invalid", String(Boolean(message)));
      });
      if (errors.name || errors.consumption) {
        inputs[errors.name ? "name" : "consumption"].focus();
        return;
      }
      const car = { ...draft, id: existing?.id ?? `car-${Date.now().toString(36)}`, name, consumption, isDefault: inputs.isDefault.checked };
      if (car.isDefault) cars.forEach((c) => (c.isDefault = false));
      cars = existing ? cars.map((c) => (c.id === car.id ? car : c)) : [...cars, car];
      if (!cars.some((c) => c.isDefault)) cars[0].isDefault = true;
      save();
      if (!existing && selectedId === "custom") selectedId = car.id;
      applySelection();
      Modal.close();
      Views.refresh();
    });

    // Delete asks once more, inline, instead of a browser confirm().
    modal.querySelector("[data-delete]")?.addEventListener("click", () => {
      const foot = modal.querySelector("[data-foot]");
      foot.innerHTML = `
        <span class="confirm-text">Biztosan törlöd: <b>${escapeHtml(existing.name)}</b>?</span>
        <span class="modal-actions">
          <button type="button" class="btn secondary" data-keep>Mégse</button>
          <button type="button" class="btn danger" data-confirm-delete>${icon("trash")}Törlés</button>
        </span>`;
      foot.querySelector("[data-keep]").addEventListener("click", () => openEditor(id));
      foot.querySelector("[data-confirm-delete]").addEventListener("click", () => {
        cars = cars.filter((c) => c.id !== id);
        if (cars.length && !cars.some((c) => c.isDefault)) cars[0].isDefault = true;
        save();
        if (selectedId === id) {
          customValues = { fuel: existing.fuel, consumption: existing.consumption };
          selectedId = defaultCar()?.id ?? "custom";
        }
        applySelection();
        Modal.close();
        Views.refresh();
      });
    });
  };

  /* ---------- Car picker (from the trip card's "Autó" row) ---------- */
  const openPicker = () => {
    const option = (id, avatar, name, meta) => `
      <li><button class="pick" role="radio" aria-checked="${selectedId === id}" data-pick="${id}">
        ${avatar}
        <span class="car-main"><span class="car-name">${name}</span><span class="car-meta">${meta}</span></span>
        ${selectedId === id ? icon("check", "pick-check") : ""}
      </button></li>`;
    const modal = Modal.open(`
      <header class="modal-head">
        <h2>Melyik autóval mész?</h2>
        <button type="button" class="icon-btn" data-close aria-label="Bezárás">${icon("close")}</button>
      </header>
      <ul class="pick-list" role="radiogroup" aria-label="Autó">
        ${cars.map((car) => option(car.id, `<span class="car-avatar" style="${avatarStyle(car.color)}">${icon("car")}</span>`, escapeHtml(car.name), carMeta(car))).join("")}
        ${option("custom", `<span class="car-avatar car-avatar--custom">${icon("custom")}</span>`, "Egyéni értékek", "Fogyasztás és üzemanyag kézzel")}
      </ul>
      <footer class="pick-foot">
        ${
          Account.user
            ? `<button type="button" class="link" data-new-car>${icon("plus")}Új autó</button>
               <button type="button" class="link" data-manage>Autók kezelése</button>`
            : `<button type="button" class="link" data-signin-link>${icon("user")}Jelentkezz be, és mentsd el az autóidat</button>`
        }
      </footer>`, "Autó kiválasztása", "picker");

    // Desktop: a dropdown under the row. Phones: a bottom sheet (CSS).
    const row = document.querySelector(".panel [data-car-row]").getBoundingClientRect();
    modal.style.setProperty("--pop-left", `${row.left}px`);
    modal.style.setProperty("--pop-top", `${row.bottom + 6}px`);
    modal.style.setProperty("--pop-width", `${row.width}px`);

    modal.querySelector("[data-pick]")?.focus();
    modal.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        selectedId = b.dataset.pick;
        applySelection();
        Modal.close();
      })
    );
    modal.querySelector("[data-new-car]")?.addEventListener("click", () => openEditor());
    modal.querySelector("[data-manage]")?.addEventListener("click", () => {
      Modal.close();
      Views.show("cars");
    });
    modal.querySelector("[data-signin-link]")?.addEventListener("click", () => {
      Modal.close();
      Views.show("cars");
    });
  };
  document.querySelectorAll("[data-car-row]").forEach((row) => row.addEventListener("click", openPicker));

  /* ---------- Start ---------- */
  applySelection();

  // Called once the first view is on screen: the picker measures the visible "Autó" row.
  return function openFromUrl() {
    const editor = params.get("editor");
    if (editor) openEditor(editor === "new" ? undefined : editor);
    if (params.get("picker") === "open") openPicker();
  };
}
