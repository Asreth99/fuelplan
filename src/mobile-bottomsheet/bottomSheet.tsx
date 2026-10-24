import { useEffect, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import RouteCard, { RouteCardProps } from "../routeCard/routeCard";
import RouteSummary from "../routeSummary/routeSummary";
import { RouteChoice } from "../routeSummary/routeTotals";
import TripDetails from "../tripDetails/tripDetails";

import "react-spring-bottom-sheet/dist/style.css";
import "./bottomSheet.css";

// Map controls (e.g. Find my location) are placed in this slot, which floats just above the sheet.
export const SHEET_MAP_CONTROLS_CLASS = "sheet-map-controls";

// The sheet opens at its peek: the route summary and the cost, so most of the screen stays map.
// Dragged up, it stops at 75% of the screen (sheet and tab bar together), never over the route card.
const PEEK_HEIGHT = 140;
const MAX_SCREEN_SHARE = 0.75;

type Props = {
  route: RouteCardProps;
  routes: RouteChoice;
};

// The sheet sits on top of the tab bar, so it can grow up to the screen height minus the tab bar.
function useHeightAboveTabBar() {
  const measure = () =>
    window.innerHeight - (document.querySelector(".main-nav--tabs")?.getBoundingClientRect().height ?? 0);
  const [height, setHeight] = useState(measure);
  useEffect(() => {
    const update = () => setHeight(measure());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}

export default function MobileBottomSheet({ route, routes }: Props) {
  const maxHeight = useHeightAboveTabBar();
  return (
    <>
      <RouteCard {...route} className="route-card--floating" />
      <BottomSheet
        open
        blocking={false}
        expandOnContentDrag
        maxHeight={maxHeight}
        snapPoints={({ maxHeight }) => {
          const tabBar = window.innerHeight - maxHeight;
          return [PEEK_HEIGHT, Math.max(window.innerHeight * MAX_SCREEN_SHARE - tabBar, PEEK_HEIGHT)];
        }}
        defaultSnap={({ snapPoints }) => snapPoints[0]}
        // The header never scrolls, so the route summary stays in view.
        header={<RouteSummary routes={routes} />}
        sibling={<div className={SHEET_MAP_CONTROLS_CLASS} />}
      >
        <div className="sheet-content">
          <TripDetails routes={routes} />
        </div>
      </BottomSheet>
    </>
  );
}
