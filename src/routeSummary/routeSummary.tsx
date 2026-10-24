import Icon from "../icons/icon";
import { formatDistance, formatDuration, RouteChoice, routeTotals } from "./routeTotals";
import "./routeSummary.css";

type Props = {
  routes: RouteChoice;
};

/** Total duration and length of the chosen route (all stops); renders nothing until there is a route. */
export default function RouteSummary({ routes }: Props) {
  const totals = routeTotals(routes.directions, routes.routeIndex);
  if (!totals) return null;

  return (
    <div className="route-summary" role="group" aria-label="Route summary">
      <span>
        <Icon name="clock" />
        {formatDuration(totals.seconds)}
      </span>
      <span>
        <Icon name="route" />
        {formatDistance(totals.meters)}
      </span>
    </div>
  );
}
