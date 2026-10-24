import { ReactNode } from "react";
import Icon, { IconName } from "../icons/icon";
import { initialsOf, useAuth } from "../auth/useAuth";
import { useView, View } from "./useView";
import "./mainNav.css";

type Props = {
  // "rail": slim left rail on desktop; "tabs": bottom tab bar on phones.
  layout: "rail" | "tabs";
};

const ITEMS: { view: View; label: string; icon: IconName }[] = [
  { view: "plan", label: "Plan", icon: "map" },
  { view: "cars", label: "Cars", icon: "car" },
];

/** Main menu: only screens that exist (Plan, Cars), plus Profile at the end. */
export default function MainNav({ layout }: Props) {
  const { view, setView } = useView();
  const { user } = useAuth();

  const item = (target: View, label: string, icon: ReactNode) => (
    <button
      key={target}
      type="button"
      className="main-nav__item"
      aria-current={view === target ? "page" : undefined}
      onClick={() => setView(target)}
    >
      <span className="main-nav__pill">{icon}</span>
      {label}
    </button>
  );

  return (
    <nav className={`main-nav main-nav--${layout}`} aria-label="Main">
      {layout === "rail" && (
        <span className="main-nav__logo" title="FuelPlan">
          <Icon name="fuel" />
        </span>
      )}
      {ITEMS.map(({ view: target, label, icon }) => item(target, label, <Icon name={icon} />))}
      {layout === "rail" && <span className="main-nav__spacer" />}
      {item(
        "profile",
        "Profile",
        user ? (
          <span className="main-nav__avatar" aria-hidden="true">
            {initialsOf(user)}
          </span>
        ) : (
          <Icon name="user" />
        )
      )}
    </nav>
  );
}
