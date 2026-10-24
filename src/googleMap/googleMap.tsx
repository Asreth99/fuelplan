import {
  GoogleMap,
  DirectionsService,
  DirectionsRenderer,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { Fragment, useEffect, useRef, useState } from "react";
import { RouteChoice } from "../routeSummary/routeTotals";
import { useTheme } from "next-themes";
import LocateButton from "../locateButton/locateButton";
import useIsMobile from "../isMobile/isMobile";
import useOneFingerZoom from "./useOneFingerZoom";
import { RouteStop } from "../routeCard/routeCard";

const initialCenter = {
  lat: 47.497913,
  lng: 19.040236,
};

// The chosen route, and Google's other route options (paler, under it, tappable to choose them).
// On the dark map the chosen route is brighter and the options dimmer, so the difference stays clear.
const ROUTE_COLORS = {
  light: { chosen: "#0e8a6d", alternative: "#8fd3bb" },
  dark: { chosen: "#2fc79a", alternative: "#3f6f61" },
};

// The map in dark mode: Google's "night" look, tinted towards the app's dark greens.
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#16201d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#16201d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8fa59f" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3a4a45" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c3d4cf" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7d948e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#18291f" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#17231f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3834" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d2926" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9cb0aa" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b4a45" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#24302d" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#24302d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b22" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];
// Fingers need more than the 6px line to hit an alternative, so an invisible wider line takes the taps.
const ALTERNATIVE_TAP_WIDTH = 28;

const ROUTE_MARGIN = 24;
// The start/end pins and their labels stick out sideways from the route's end points.
const PIN_ROOM = 40;

// Keeps a found route inside the part of the map not covered by the panel (desktop)
// or by the route card and bottom sheet (mobile), measured from the actual elements.
function routePadding(isMobile: boolean): google.maps.Padding {
  const bottomOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().bottom ?? 0;
  const topOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? window.innerHeight;
  // The map leaves room for the menu (desktop rail on the left, phone tab bar at the bottom).
  const map = document.querySelector(".map-container")?.getBoundingClientRect();
  const mapLeft = map?.left ?? 0;
  const mapBottom = map?.bottom ?? window.innerHeight;

  if (isMobile) {
    // A fully expanded sheet would leave no room; then fit above its middle position instead.
    const sheetHeight = Math.min(mapBottom - topOf("[data-rsbs-overlay]"), mapBottom * 0.4);
    return {
      top: bottomOf(".route-card--floating") + ROUTE_MARGIN,
      bottom: sheetHeight + ROUTE_MARGIN,
      left: PIN_ROOM,
      right: PIN_ROOM,
    };
  }
  const panelRight = document.querySelector(".desktop-panel")?.getBoundingClientRect().right ?? 0;
  return {
    top: ROUTE_MARGIN * 2,
    bottom: ROUTE_MARGIN * 2,
    left: Math.max(panelRight - mapLeft, 0) + PIN_ROOM,
    right: PIN_ROOM + 40, // also clear of the zoom and location buttons
  };
}

// A, B, C, … for the start, the stops and the destination, as on the route card.
const stopLetter = (index: number) => String.fromCharCode(65 + index);

type Props = {
  stops: RouteStop[];
  fromLocation: { lat?: number; lng?: number };
  routes: RouteChoice;
  setDirections: (d: google.maps.DirectionsResult | null) => void;
  requestDirections: boolean;
  setRequestDirections: (r: boolean) => void;
  avoidFerries: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
  onRouteError: (message: string) => void;
  onMyLocation: (position: google.maps.LatLngLiteral) => void;
  fitToRoute: boolean;
};

function MapComponent({
  stops,
  routes,
  setDirections,
  requestDirections,
  setRequestDirections,
  fromLocation,
  avoidFerries,
  avoidHighways,
  avoidTolls,
  onRouteError,
  onMyLocation,
  fitToRoute,
}: Props) {
  const [center, setCenter] = useState(initialCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const isMobile = useIsMobile();
  // Read when a new route arrives, so flipping the flag alone doesn't re-zoom the old route.
  const fitToRouteRef = useRef(fitToRoute);
  fitToRouteRef.current = fitToRoute;
  useOneFingerZoom(map);
  const [myLocation, setMyLocation] =
    useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (fromLocation.lat !== undefined && fromLocation.lng !== undefined) {
      setCenter({
        lat: fromLocation.lat,
        lng: fromLocation.lng,
      });
    }
  }, [fromLocation.lat, fromLocation.lng]);

  const { directions, routeIndex, onSelectRoute } = routes;
  const dark = useTheme().resolvedTheme === "dark";
  const routeColors = ROUTE_COLORS[dark ? "dark" : "light"];

  // A new route is fitted with all its options in view. Choosing another option doesn't move the map.
  useEffect(() => {
    if (map && directions && fitToRouteRef.current) {
      const bounds = new google.maps.LatLngBounds();
      directions.routes.forEach((route) => bounds.union(route.bounds));
      map.fitBounds(bounds, routePadding(isMobile));
    }
  }, [map, directions, isMobile]);

  // One marker per place of the chosen route: the start of every leg, plus the final destination.
  const legs = directions?.routes[routeIndex]?.legs ?? [];
  const routeMarkers = legs.length
    ? [
        ...legs.map((leg) => ({ position: leg.start_location, address: leg.start_address })),
        { position: legs[legs.length - 1].end_location, address: legs[legs.length - 1].end_address },
      ]
    : [];

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={center}
      zoom={15}
      options={{
        gestureHandling: "greedy",
        // These corner controls sit under the panel (desktop) or the route card (mobile).
        mapTypeControl: false,
        fullscreenControl: !isMobile,
        // Google's place icons open place cards the app has no use for (and that crash in Safari).
        clickableIcons: false,
        // Lets fitBounds zoom between whole levels, so a route fills the free space snugly.
        isFractionalZoomEnabled: true,
        styles: dark ? DARK_MAP_STYLE : [],
        backgroundColor: dark ? "#16201d" : undefined, // shown while tiles load
      }}
      onLoad={setMap}
    >
      <LocateButton
        map={map}
        onLocated={(position) => {
          setMyLocation(position);
          onMyLocation(position);
        }}
      />
      {myLocation && (
        <Marker
          position={myLocation}
          title="Your location"
          options={{ optimized: false }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          }}
        />
      )}
      {requestDirections && (
        <DirectionsService
          options={{
            origin: stops[0].place,
            destination: stops[stops.length - 1].place,
            // The stops in between, in the order the user arranged them.
            waypoints: stops.slice(1, -1).map((stop) => ({ location: stop.place, stopover: true })),
            optimizeWaypoints: false,
            // Google adds other route options only when there are no stops in between.
            provideRouteAlternatives: true,
            travelMode: "DRIVING" as google.maps.TravelMode,
            avoidFerries: avoidFerries,
            avoidHighways: avoidHighways,
            avoidTolls: avoidTolls,
          }}
          callback={(result, status) => {
            // Ne try-catch, hanem status ellenőrzés
            if (status === "OK" && result) {
              setDirections(result);
              onRouteError("");
            } else {
              console.error("Directions request failed:", status);
              onRouteError(
                "No route found. Check the places or the Avoid options."
              );
            }
            setRequestDirections(false);
          }}
        />
      )}
      {/* The chosen start, until a route (with its own markers) is found */}
      {!directions && fromLocation.lat !== undefined && fromLocation.lng !== undefined && (
        <Marker position={{ lat: fromLocation.lat, lng: fromLocation.lng }} />
      )}

      {routeMarkers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          label={{ text: stopLetter(index), color: "#ffffff", fontWeight: "700" }}
          title={`${stopLetter(index)}: ${marker.address}`}
          options={{ optimized: false }}
        />
      ))}

      {directions?.routes.map((route, index) =>
        index === routeIndex ? null : (
          <Fragment key={index}>
            <Polyline
              path={route.overview_path}
              options={{ strokeColor: routeColors.alternative, strokeOpacity: 0.95, strokeWeight: 6, clickable: false, zIndex: 1 }}
            />
            <Polyline
              path={route.overview_path}
              options={{ strokeOpacity: 0, strokeWeight: ALTERNATIVE_TAP_WIDTH, clickable: true, zIndex: 2 }}
              onClick={() => onSelectRoute(index)}
            />
          </Fragment>
        )
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          routeIndex={routeIndex}
          options={{
            preserveViewport: true,
            suppressMarkers: true, // drawn above, one per stop
            polylineOptions: {
              strokeColor: routeColors.chosen,
              strokeOpacity: 0.95,
              strokeWeight: 6,
              zIndex: 3, // above the other options
            },
          }}
        />
      )}
    </GoogleMap>
  );
}

export default MapComponent;
