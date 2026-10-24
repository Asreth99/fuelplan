import RouteCard, { RouteCardProps } from "../routeCard/routeCard";
import RouteSummary from "../routeSummary/routeSummary";
import { RouteChoice } from "../routeSummary/routeTotals";
import TripDetails from "../tripDetails/tripDetails";
import "./desktopPanel.css";

type Props = {
  route: RouteCardProps;
  routes: RouteChoice;
  // Hidden (not unmounted) on the Cars and Profile screens, so the trip is kept.
  hidden: boolean;
};

export default function DesktopPanel({ route, routes, hidden }: Props) {
  return (
    <aside className="desktop-panel" aria-label="Trip planner" hidden={hidden}>
      <RouteCard {...route} />
      <div className="desktop-panel__trip">
        <RouteSummary routes={routes} />
        <TripDetails routes={routes} />
      </div>
    </aside>
  );
}
