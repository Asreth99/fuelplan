/** A phone-sized screen, below the app's 900px mobile breakpoint. */
export const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

/** How far the phone's trip sheet can be dragged up: 75% of the screen (bottomSheet.tsx). */
export const SHEET_MAX_SCREEN_SHARE = 0.75;

/** Pulls on a dialog sheet's top bar: a short one springs back, a long one closes it (modal.tsx: 120px). */
export const SHORT_PULL_PX = 40;
export const CLOSING_PULL_PX = 250;
/** Pulling the trip sheet this far below its peek makes it rubber-band down into the tab bar's area. */
export const OVER_PULL_PX = 200;
