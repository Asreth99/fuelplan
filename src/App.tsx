import "./theme.css";
import "./style.css";
import { useEffect, useRef, useState } from "react";
import MapComponent from "./googleMap/googleMap";
import useIsMobile from "./isMobile/isMobile";
import { Libraries, LoadScript } from "@react-google-maps/api";
import Loading from "./loading/loading";
import MobileBottomSheet from "./mobile-bottomsheet/bottomSheet";
import DesktopPanel from "./desktopPanel/desktopPanel";
import { RouteCardProps, RouteStop } from "./routeCard/routeCard";
import { RouteChoice } from "./routeSummary/routeTotals";
import helper from "./calculator/helper";
import MainNav from "./navigation/mainNav";
import { View, ViewContext } from "./navigation/useView";
import CarsView from "./cars/carsView";
import CarEditor from "./cars/carEditor";
import { useCars } from "./cars/useCars";
import ProfileView from "./profile/profileView";
import { useAuth } from "./auth/useAuth";

// Must keep the same identity between renders, or LoadScript reloads the Maps script.
const MAPS_LIBRARIES: Libraries = ["places"];

// Ids must stay unique for the page's whole life. A module-level counter restarts at 0 whenever
// the module is re-run (e.g. a dev-server hot reload) and then hands out ids already in use,
// which makes React mix up rows.
const newStop = (): RouteStop => ({
  id: `stop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  place: "",
});

// A route can be planned once every field (start, stops, destination) has a place.
const isComplete = (stops: RouteStop[]) => stops.every((stop) => stop.place !== "");

function ReFuel() {
  const [stops, setStops] = useState<RouteStop[]>(() => [newStop(), newStop()]);
  const [directions, setDirectionsState] =
    useState<google.maps.DirectionsResult | null>(null);
  // Which of Google's route options is used; a newly found route starts on Google's recommendation.
  const [routeIndex, setRouteIndex] = useState(0);
  const setDirections = (result: google.maps.DirectionsResult | null) => {
    setDirectionsState(result);
    setRouteIndex(0);
  };
  const routes: RouteChoice = { directions, routeIndex, onSelectRoute: setRouteIndex };
  const [requestDirections, setRequestDirections] = useState(false);
  // Whether the map should zoom to the next found route (not when the user just jumped to their location).
  const [fitToRoute, setFitToRoute] = useState(true);
  const [routeError, setRouteError] = useState("");
  const [fromLocation, setFromLocation] = useState<{
    lat?: number;
    lng?: number;
  }>({});
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);
  const { openedWithSignInLink } = useAuth();
  const { editor } = useCars();
  // A sign-in link opens the app on Profile, where the sign-in finishes.
  const [view, setView] = useState<View>(openedWithSignInLink ? "profile" : "plan");

  // Lets CSS hide the phone's route card and trip sheet on the Cars and Profile screens.
  useEffect(() => {
    document.body.dataset.view = view;
  }, [view]);

  // Wakes up the price server (Cloud Run cold start) before the user needs a price.
  useEffect(() => {
    helper.getFuelPrice().catch(() => {});
  }, []);

  useEffect(() => {
    function setAppHeight() {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    }

    window.addEventListener("resize", setAppHeight);
    setAppHeight();

    return () => {
      window.removeEventListener("resize", setAppHeight);
    };
  }, []);

  const isMobile = useIsMobile();

  // Read by async callbacks (location fix, Google's place picks), which outlive the render they were created in.
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const searchRoute = (fit: boolean) => {
    setFitToRoute(fit);
    setRouteError("");
    setRequestDirections(true);
  };

  // Every change to the stops re-plans the route in the new order, once all of them are filled in.
  const changeStops = (next: RouteStop[], fit = true) => {
    setStops(next);
    if (isComplete(next)) searchRoute(fit);
  };

  // Changing an Avoid option re-plans a route that is already on the map.
  const replanWith = (set: (v: boolean) => void) => (value: boolean) => {
    set(value);
    if (directions && isComplete(stops)) searchRoute(true);
  };

  // A location fix becomes the start ("Your location"). The map stays on the user's position;
  // a route that is already planned is re-planned from there without zooming away.
  const startFromMyLocation = (position: google.maps.LatLngLiteral) => {
    setFromLocation({});
    const [start, ...rest] = stopsRef.current;
    changeStops([{ ...start, place: position }, ...rest], false);
  };

  const route: RouteCardProps = {
    stops,
    onChoosePlace: (id, place, location) => {
      const current = stopsRef.current;
      if (id === current[0].id) setFromLocation(location ?? {});
      changeStops(current.map((stop) => (stop.id === id ? { ...stop, place } : stop)));
    },
    // A new stop goes before the destination; the route waits until it is filled in.
    onAddStop: () => {
      const stop = newStop();
      setStops([...stops.slice(0, -1), stop, stops[stops.length - 1]]);
      return stop.id;
    },
    onRemoveStop: (id) => changeStops(stops.filter((stop) => stop.id !== id)),
    onReorderStops: (ids) => changeStops(ids.map((id) => stops.find((stop) => stop.id === id)!)),
    searching: requestDirections,
    routeError,
    avoidTolls,
    setAvoidTolls: replanWith(setAvoidTolls),
    avoidHighways,
    setAvoidHighways: replanWith(setAvoidHighways),
    avoidFerries,
    setAvoidFerries: replanWith(setAvoidFerries),
  };

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {/* Outside .app (a fixed element, so its own stacking layer): the phone's trip sheet is drawn
          at page level, and the tab bar must stay above it when the sheet is pulled down too far. */}
      <MainNav layout={isMobile ? "tabs" : "rail"} />
      <div className="app">
        {view !== "plan" && (
          // data-body-scroll-lock-ignore: see modal.tsx (iOS touch scrolling under the trip sheet's lock)
          <section
            className="side-view"
            aria-label={view === "cars" ? "Cars" : "Profile"}
            data-body-scroll-lock-ignore=""
          >
            {view === "cars" ? <CarsView /> : <ProfileView />}
          </section>
        )}
        {editor && <CarEditor key={editor.car?.id ?? "new"} />}
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string}
          loadingElement={<Loading />}
          libraries={MAPS_LIBRARIES}
        >
          <MapComponent
            stops={stops}
            routes={routes}
            setDirections={setDirections}
            requestDirections={requestDirections}
            setRequestDirections={setRequestDirections}
            fromLocation={fromLocation}
            avoidFerries={avoidFerries}
            avoidHighways={avoidHighways}
            avoidTolls={avoidTolls}
            onRouteError={setRouteError}
            onMyLocation={startFromMyLocation}
            fitToRoute={fitToRoute}
          />

          {isMobile ? (
            <MobileBottomSheet route={route} routes={routes} />
          ) : (
            <DesktopPanel route={route} routes={routes} hidden={view !== "plan"} />
          )}
        </LoadScript>
      </div>
    </ViewContext.Provider>
  );
}

export default ReFuel;
