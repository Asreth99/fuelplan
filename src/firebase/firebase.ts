import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
} from "firebase/firestore";

// With REACT_APP_FIREBASE_EMULATORS=true the app talks to the local Firebase emulators
// (npm run emulators). A "demo-" project id needs no real Firebase project or keys.
export const EMULATOR_PROJECT_ID = "demo-fuelplan";
const useEmulators = process.env.REACT_APP_FIREBASE_EMULATORS === "true";

const config = useEmulators
  ? { apiKey: "demo-api-key", authDomain: "localhost", projectId: EMULATOR_PROJECT_ID, appId: "demo-app" }
  : {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

// Without a configuration the app still works; only accounts and saved cars are unavailable.
export const accountsAvailable = Boolean(config.apiKey && config.projectId);

// The production database is a named one (fuelplandb, in the EU); the emulator uses "(default)".
const databaseId = (!useEmulators && process.env.REACT_APP_FIREBASE_DATABASE_ID) || "(default)";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function startFirestore(firebaseApp: FirebaseApp) {
  // A persistent cache keeps cars usable offline and syncs edits when the connection returns.
  const firestore = initializeFirestore(
    firebaseApp,
    { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
    databaseId
  );
  if (useEmulators) connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  return firestore;
}

if (accountsAvailable) {
  app = initializeApp(config);
  auth = getAuth(app);
  if (useEmulators) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  db = startFirestore(app);
}

export const firebaseAuth = () => auth;
export const firestore = () => db;

// After signing out, the cached cars must not stay on a shared computer: drop the local cache.
export async function clearLocalData() {
  if (!app || !db) return;
  await terminate(db);
  await clearIndexedDbPersistence(db);
  db = startFirestore(app);
}
