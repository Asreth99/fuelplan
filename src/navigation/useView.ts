import { createContext, useContext } from "react";

export type View = "plan" | "cars" | "profile";

type ViewContextValue = { view: View; setView: (view: View) => void };

/** The screen chosen in the main menu. Provided by App, so deep components can switch screens. */
export const ViewContext = createContext<ViewContextValue>({ view: "plan", setView: () => {} });

export const useView = () => useContext(ViewContext);
