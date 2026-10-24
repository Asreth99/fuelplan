import { Page } from "@playwright/test";
import { AppShell } from "./appShell";
import { CarsPage } from "./carsPage";
import { MainMenu } from "./mainMenu";
import { ProfilePage } from "./profilePage";
import { SignInPanel } from "./signInPanel";
import { TripPanel } from "./tripPanel";

/** Another device: a separate browser context (own storage and session) with its own page objects. */
export class Device {
  readonly app: AppShell;
  readonly menu: MainMenu;
  readonly signIn: SignInPanel;
  readonly cars: CarsPage;
  readonly profile: ProfilePage;
  readonly trip: TripPanel;

  constructor(readonly page: Page) {
    this.app = new AppShell(page);
    this.menu = new MainMenu(page);
    this.signIn = new SignInPanel(page);
    this.cars = new CarsPage(page);
    this.profile = new ProfilePage(page);
    this.trip = new TripPanel(page);
  }
}
