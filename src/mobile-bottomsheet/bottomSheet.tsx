import { useEffect, useRef, useState } from "react";
import { BottomSheet, BottomSheetRef } from "react-spring-bottom-sheet";
import RouteCard, { RouteCardProps } from "../routeCard/routeCard";
import RouteSummary from "../routeSummary/routeSummary";
import { RouteChoice } from "../routeSummary/routeTotals";
import TripDetails from "../tripDetails/tripDetails";

import "react-spring-bottom-sheet/dist/style.css";
import "./bottomSheet.css";

// Map controls (e.g. Find my location) are placed in this slot, which floats just above the sheet.
export const SHEET_MAP_CONTROLS_CLASS = "sheet-map-controls";

// The sheet opens at its peek: exactly the route summary and the whole cost card, so most of the
// screen stays map. The card is taller once there is a cost, and the peek follows it.
// Dragged up, it stops at 75% of the screen (sheet and tab bar together), never over the route card.
const PEEK_BEFORE_MEASURED = 140;
const PEEK_GAP = 12; // space under the cost card
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

// The peek's height: the sheet's header (grabber and route summary) plus the whole cost card,
// measured live, because both change size (a route appears, the hint becomes a cost).
function usePeekHeight(content: HTMLElement | null) {
  const [peek, setPeek] = useState(PEEK_BEFORE_MEASURED);
  useEffect(() => {
    const card = content?.querySelector<HTMLElement>(".trip__cost");
    const header = document.querySelector<HTMLElement>("[data-rsbs-header]");
    if (!card || !header) return;
    const measure = () => setPeek(Math.ceil(header.offsetHeight + card.offsetHeight + PEEK_GAP));
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, [content]);
  return peek;
}

export default function MobileBottomSheet({ route, routes }: Props) {
  const maxHeight = useHeightAboveTabBar();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const peek = usePeekHeight(content);
  const sheet = useRef<BottomSheetRef>(null);

  // The highest position: 75% of the screen, sheet and tab bar together.
  const topSnap = Math.max(window.innerHeight * MAX_SCREEN_SHARE - (window.innerHeight - maxHeight), peek);

  // There are only two positions, so a sheet that isn't at the top is at (or opening to) its peek:
  // it follows the new peek height. One the user dragged to the top stays put.
  const topSnapRef = useRef(topSnap);
  topSnapRef.current = topSnap;
  const peekRef = useRef(peek);
  peekRef.current = peek;
  const followPeek = () => {
    if (sheet.current && sheet.current.height < topSnapRef.current - 4) sheet.current.snapTo(peekRef.current);
  };
  useEffect(followPeek, [peek]);

  return (
    <>
      <RouteCard {...route} className="route-card--floating" />
      <BottomSheet
        ref={sheet}
        open
        blocking={false}
        expandOnContentDrag
        maxHeight={maxHeight}
        snapPoints={() => [peek, topSnap]}
        onSpringEnd={(event) => {
          // The sheet ignores snapTo while it slides in, which is when the first measurement arrives.
          if (event.type === "OPEN") followPeek();
          // Back at the peek, the inputs scroll back under the cost card, so none of them peek out below it.
          const scroller = content?.closest<HTMLElement>("[data-rsbs-scroll]");
          if (scroller && sheet.current && sheet.current.height < topSnapRef.current - 4) scroller.scrollTop = 0;
        }}
        defaultSnap={({ snapPoints }) => snapPoints[0]}
        // The header never scrolls, so the route summary stays in view.
        header={<RouteSummary routes={routes} />}
        sibling={<div className={SHEET_MAP_CONTROLS_CLASS} />}
      >
        <div className="sheet-content" ref={setContent}>
          <TripDetails routes={routes} />
        </div>
      </BottomSheet>
    </>
  );
}
