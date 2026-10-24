/** Users and car documents for the Firestore security rules tests. */
export const OWNER_UID = "anna";
export const STRANGER_UID = "mallory";

/** Field changes the rules must refuse on a car document (merged into an otherwise valid car). */
export const INVALID_CAR_FIELDS = [
  { what: "an empty name", fields: { name: "" } },
  { what: "a 31-character name", fields: { name: "x".repeat(31) } },
  { what: "a fuel the app doesn't price", fields: { fuel: "petrol100" } },
  { what: "a consumption above 40", fields: { consumption: 41 } },
  { what: "a consumption below 1", fields: { consumption: 0.5 } },
  { what: "the consumption as text", fields: { consumption: "6.5" } },
  { what: "a colour that isn't #rrggbb", fields: { color: "red" } },
  { what: "a creation time that isn't a timestamp", fields: { createdAt: "yesterday" } },
  { what: "an extra field", fields: { owner: "someone" } },
];
