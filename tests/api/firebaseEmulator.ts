import { APIRequestContext } from "@playwright/test";

const PROJECT_ID = "demo-fuelplan";
const AUTH = `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}`;
const FIRESTORE = `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type OobCode = { email: string; requestType: string; oobLink: string };

/** The local Firebase emulators (Auth + Firestore) the app uses in tests. Never production. */
export class FirebaseEmulator {
  constructor(private readonly request: APIRequestContext) {}

  /** Deletes every test account and every saved car. */
  async reset() {
    await this.request.delete(`${AUTH}/accounts`);
    await this.request.delete(FIRESTORE);
  }

  /** The newest sign-in link "emailed" to this address (the emulator keeps them instead of sending). */
  async latestSignInLink(email: string) {
    const response = await this.request.get(`${AUTH}/oobCodes`);
    const { oobCodes } = (await response.json()) as { oobCodes: OobCode[] };
    const links = oobCodes.filter((code) => code.email === email && code.requestType === "EMAIL_SIGNIN");
    if (!links.length) throw new Error(`No sign-in link was sent to ${email}`);
    return links[links.length - 1].oobLink;
  }
}
