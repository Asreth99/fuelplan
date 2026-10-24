/*
 * Profile and sign-in ("Profil") for the B direction mock: Apple, Google and email-link sign-in
 * (simulated), the profile screen, the sign-in panel the Cars screen reuses, and CloudStore,
 * which stands in for Firestore (users/{uid}/cars). Prototype code only — no real sign-in happens.
 *
 * URL options (for screenshots and direct links):
 *   ?auth=signedin|signedout   start signed in (sample Google account) or signed out
 *   ?signin=email-sent         show the "check your inbox" step
 *   ?sync=offline              the profile shows the offline state
 *   ?confirm=delete            open the delete-account confirmation
 */

Object.assign(ICONS, {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z"/>',
  "cloud-check": '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17 18z"/><path d="m9.5 13.5 2 2 3.5-3.5"/>',
  "cloud-off": '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17 18zM4 4l16 16"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
});
NAV_ITEMS.profile = { icon: "user", label: "Profil" };

const SAMPLE_ACCOUNTS = {
  google: { uid: "u-anna", name: "Kovács Anna", email: "anna.kovacs@example.com", provider: "google" },
  // Apple users may hide their address; Apple then relays mail through a private address.
  apple: { uid: "u-anna-apple", name: "Kovács Anna", email: "k7q2x9m4pz@privaterelay.appleid.com", provider: "apple" },
};
const PROVIDER_LABELS = { google: "Google-fiók", apple: "Apple ID", email: "E-mail link" };
const ACCOUNT_KEY = "fuelplan-proto-account";

// The cars the sample accounts already "have in the cloud", e.g. from another device.
const SAMPLE_CARS = [
  { id: "golf", name: "Golf VII", fuel: "diesel", consumption: 6.5, color: "#0e8a6d", isDefault: true },
  { id: "fabia", name: "Škoda Fabia", fuel: "petrol95", consumption: 5.4, color: "#e8553d", isDefault: false },
  { id: "transit", name: "Céges Transit", fuel: "diesel", consumption: 9.1, color: "#1f6feb", isDefault: false },
];

/* ---------- CloudStore: stands in for Firestore users/{uid}/cars ---------- */
const CloudStore = {
  key: (user) => `fuelplan-proto-cloud:${user.uid}`,
  load(user) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.key(user)));
      if (Array.isArray(saved)) return saved;
    } catch {}
    return user.provider === "email" ? [] : SAMPLE_CARS.map((car) => ({ ...car }));
  },
  save(user, cars) {
    localStorage.setItem(this.key(user), JSON.stringify(cars));
  },
  deleteAll(user) {
    localStorage.setItem(this.key(user), "[]");
  },
};

/* ---------- Account: who is signed in ---------- */
const Account = {
  user: null,
  listeners: [],

  onChange(listener) {
    this.listeners.push(listener);
  },

  set(user) {
    this.user = user;
    try {
      user ? localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user)) : localStorage.removeItem(ACCOUNT_KEY);
    } catch {}
    this.listeners.forEach((listener) => listener(user));
    updateNavAvatars();
    Views.refresh(); // after every listener, so views render the new user's data
  },

  initials(user) {
    if (!user.name) return user.email[0].toUpperCase();
    return user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  },
};

// The menu's profile item shows the user's initials once signed in.
function updateNavAvatars() {
  document.querySelectorAll('[data-nav="profile"]').forEach((item) => {
    const slot = item.querySelector(".pill") || item;
    slot.querySelector(".ic, .nav-avatar")?.remove();
    slot.insertAdjacentHTML(
      "afterbegin",
      Account.user ? `<span class="nav-avatar" aria-hidden="true">${escapeHtml(Account.initials(Account.user))}</span>` : icon("user")
    );
  });
}

/* ---------- Sign-in panel (used by Profile and by the Cars screen when signed out) ---------- */
function signInPanelHtml({ heading, text }) {
  return `
    <div class="signin" data-signin-panel>
      <h2 class="signin-title">${heading}</h2>
      <p class="signin-text">${text}</p>
      <div class="signin-buttons">
        <button type="button" class="btn provider provider--apple" data-provider="apple">Folytatás Apple-lel</button>
        <button type="button" class="btn provider provider--google" data-provider="google">Folytatás Google-fiókkal</button>
      </div>
      <div class="signin-or"><span>vagy e-mailben, jelszó nélkül</span></div>
      <form class="signin-email" novalidate>
        <label class="field">
          <span class="field-label">E-mail-cím</span>
          <input type="email" name="email" placeholder="nev@pelda.hu" autocomplete="email">
          <span class="field-error" data-error="email"></span>
        </label>
        <button type="submit" class="btn secondary">${icon("mail")}Belépési link küldése</button>
      </form>
      <p class="signin-legal">A belépéssel elfogadod az <a href="#" data-privacy>adatkezelési tájékoztatót</a>. Jelszót nem tárolunk.</p>
    </div>`;
}

function emailSentHtml(email) {
  return `
    <div class="signin-sent" data-email-sent>
      <span class="signin-sent-art">${icon("mail")}</span>
      <h2>Nézd meg a postafiókodat</h2>
      <p>Küldtünk egy belépési linket ide: <b>${escapeHtml(email)}</b>. Nyisd meg ezen az eszközön, és már bent is vagy.</p>
      <button type="button" class="btn primary" data-open-link>Prototípus: a link megnyitása</button>
      <div class="signin-sent-actions">
        <button type="button" class="link" data-resend disabled>Újraküldés (30 mp)</button>
        <button type="button" class="link" data-other-email>Másik e-mail-cím</button>
      </div>
    </div>`;
}

function bindSignInPanel(root) {
  root.querySelectorAll("[data-provider]").forEach((button) =>
    button.addEventListener("click", () => {
      // The real app opens the provider's own sign-in window here.
      button.disabled = true;
      button.textContent = "Bejelentkezés…";
      setTimeout(() => {
        Account.set(SAMPLE_ACCOUNTS[button.dataset.provider]);
        Toast.show("Bejelentkeztél");
      }, 700);
    })
  );

  const form = root.querySelector(".signin-email");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector('[name="email"]');
    const email = input.value.trim();
    const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    form.querySelector('[data-error="email"]').textContent = valid ? "" : "Adj meg egy érvényes e-mail-címet.";
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid) return input.focus();
    showEmailSent(root.querySelector("[data-signin-panel]"), email);
  });
}

function showEmailSent(panel, email) {
  panel.innerHTML = emailSentHtml(email);
  let secondsLeft = 30;
  const resend = panel.querySelector("[data-resend]");
  const timer = setInterval(() => {
    secondsLeft -= 1;
    resend.textContent = secondsLeft > 0 ? `Újraküldés (${secondsLeft} mp)` : "Újraküldés";
    resend.disabled = secondsLeft > 0;
    if (secondsLeft <= 0) clearInterval(timer);
  }, 1000);
  resend.addEventListener("click", () => Toast.show("Új linket küldtünk"));
  panel.querySelector("[data-open-link]").addEventListener("click", () => {
    clearInterval(timer);
    Account.set({ uid: `u-${email}`, name: null, email, provider: "email" });
    Toast.show("Bejelentkeztél");
  });
  panel.querySelector("[data-other-email]").addEventListener("click", () => {
    clearInterval(timer);
    Views.refresh();
  });
}

/* ---------- Profile view ---------- */
function bootAccount() {
  const params = new URLSearchParams(location.search);
  if (params.get("auth") === "signedin") Account.user = SAMPLE_ACCOUNTS.google;
  else if (params.get("auth") !== "signedout") {
    try {
      Account.user = JSON.parse(localStorage.getItem(ACCOUNT_KEY));
    } catch {}
  }
  let showEmailSentOnce = params.get("signin") === "email-sent";

  const view = Views.addPanel("profile", "Profil");

  const renderProfile = () => {
    const user = Account.user;
    if (!user) {
      view.innerHTML = `
        <header class="cars-head"><div><h1 class="cars-title">Profil</h1></div></header>
        ${signInPanelHtml({
          heading: "Lépj be a FuelPlanbe",
          text: "Az autóid a fiókodba kerülnek: minden eszközödön elérhetők, és nem vesznek el.",
        })}`;
      bindSignInPanel(view);
      if (showEmailSentOnce) {
        showEmailSentOnce = false;
        showEmailSent(view.querySelector("[data-signin-panel]"), "anna.kovacs@example.com");
      }
      return;
    }

    const offline = params.get("sync") === "offline";
    const carCount = CloudStore.load(user).length;
    view.innerHTML = `
      <header class="cars-head"><div><h1 class="cars-title">Profil</h1></div></header>
      <div class="profile-card">
        <span class="profile-avatar" aria-hidden="true">${escapeHtml(Account.initials(user))}</span>
        <span class="profile-who">
          <b>${escapeHtml(user.name || user.email)}</b>
          <span>${escapeHtml(user.email)}</span>
        </span>
        <span class="provider-pill">${PROVIDER_LABELS[user.provider]}</span>
      </div>
      <p class="sync${offline ? " sync--offline" : ""}" role="status">
        ${icon(offline ? "cloud-off" : "cloud-check")}
        ${offline ? "Offline vagy. A változásokat elmentjük, amint újra lesz internet." : "Szinkronizálva: az autóid minden eszközödön elérhetők."}
      </p>
      <ul class="profile-list">
        <li><button class="profile-row" data-go-cars>${icon("car")}<span>Autóim</span><span class="profile-row-meta">${carCount} autó</span>${icon("chevron", "row-chev")}</button></li>
        <li><a class="profile-row" href="#" data-privacy>${icon("shield")}<span>Adatkezelési tájékoztató</span>${icon("chevron", "row-chev")}</a></li>
        <li><button class="profile-row" data-signout>${icon("logout")}<span>Kijelentkezés</span></button></li>
      </ul>
      <section class="danger-zone" aria-labelledby="danger-title">
        <h2 id="danger-title">Fiók törlése</h2>
        <p>Végleg törli a fiókodat és az összes mentett autódat.</p>
        <button class="btn danger-outline" data-delete-account>${icon("trash")}Fiók törlése</button>
      </section>`;

    view.querySelector("[data-go-cars]").addEventListener("click", () => Views.show("cars"));
    view.querySelector("[data-signout]").addEventListener("click", () => {
      Account.set(null);
      Toast.show("Kijelentkeztél");
    });
    view.querySelector("[data-delete-account]").addEventListener("click", openDeleteAccount);
  };
  Views.register("profile", renderProfile);

  // Deleting is final, so it needs an explicit "I understand" before the button works.
  function openDeleteAccount() {
    const user = Account.user;
    const carCount = CloudStore.load(user).length;
    const box = Modal.open(`
      <header class="modal-head">
        <h2>Fiók törlése</h2>
        <button type="button" class="icon-btn" data-close aria-label="Bezárás">${icon("close")}</button>
      </header>
      <p class="modal-text">Ezzel végleg töröljük a fiókodat (<b>${escapeHtml(user.email)}</b>) és a mentett autóidat (<b>${carCount}</b>). Ezt nem lehet visszavonni.</p>
      <p class="modal-note">${icon("shield")}Biztonsági okból a törlés előtt még egyszer megerősítjük, hogy te vagy az, ugyanúgy, ahogy belépsz.</p>
      <label class="check-row"><input type="checkbox" data-understand> Értem, hogy a törlés végleges.</label>
      <footer class="modal-foot">
        <span></span>
        <span class="modal-actions">
          <button type="button" class="btn secondary" data-close>Mégse</button>
          <button type="button" class="btn danger" data-confirm disabled>Fiók végleges törlése</button>
        </span>
      </footer>`, "Fiók törlése", "editor");
    const confirm = box.querySelector("[data-confirm]");
    box.querySelector("[data-understand]").addEventListener("change", (e) => (confirm.disabled = !e.target.checked));
    confirm.addEventListener("click", () => {
      CloudStore.deleteAll(user);
      Modal.close();
      Account.set(null);
      Toast.show("A fiókodat és az adataidat töröltük");
    });
  }

  updateNavAvatars();

  // Called once the first view is on screen.
  return function openFromUrl() {
    if (params.get("confirm") === "delete" && Account.user) openDeleteAccount();
  };
}
