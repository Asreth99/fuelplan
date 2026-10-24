/** Test accounts. They exist only in the local Firebase Auth emulator (project demo-fuelplan). */
export type Account = {
  provider: "Google" | "email";
  name?: string;
  email: string;
  // How the profile card labels the sign-in method.
  methodLabel: string;
  initials: string;
};

export const GOOGLE_ACCOUNT: Account = {
  provider: "Google",
  name: "Anna Kovács",
  email: "anna.kovacs@example.com",
  methodLabel: "Google account",
  initials: "AK",
};

export const EMAIL_ACCOUNT: Account = {
  provider: "email",
  email: "csilla.nagy@example.com",
  methodLabel: "Email link",
  initials: "C",
};

export const INVALID_EMAIL = "csilla.nagy@";
