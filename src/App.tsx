import "./style.css";
import { useEffect, useState } from "react";
import SideBar from "./sidebar/sidebar";
import MapComponent from "./googleMap/googleMap";
import useIsMobile from "./isMobile/isMobile";
import { LoadScript } from "@react-google-maps/api";
import Loading from "./loading/loading";
import MobileBottomSheet from "./mobile-bottomsheet/bottomSheet";
import helper from "./calculator/helper";

function ReFuel() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [requestDirections, setRequestDirections] = useState(false);
  const [fromLocation, setFromLocation] = useState<{
    lat?: number;
    lng?: number;
  }>({});

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

  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);

  const isMobile = useIsMobile();
  const handleSubmit = () => {
    setRequestDirections(true);
  };

  if (fromLocation.lat && fromLocation.lng) {
    console.log("Origin Location:", fromLocation.lat, fromLocation.lng);
  }

  return (
    <>
      <div style={{ position: "relative", display: "flex" }}>
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string}
          loadingElement={<Loading  />}
          libraries={["places"]}
        >
          {isMobile ? (
            <MobileBottomSheet
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              directions={directions}
              onSubmit={handleSubmit}
              setFromLocation={setFromLocation}
              avoidFerries={avoidFerries}
              setAvoidFerries={setAvoidFerries}
              avoidHighways={avoidHighways}
              setAvoidHighways={setAvoidHighways}
              avoidTolls={avoidTolls}
              setAvoidTolls={setAvoidTolls}
            />
          ) : (
            <SideBar
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              directions={directions}
              onSubmit={handleSubmit}
              setFromLocation={setFromLocation}
              avoidFerries={avoidFerries}
              setAvoidFerries={setAvoidFerries}
              avoidHighways={avoidHighways}
              setAvoidHighways={setAvoidHighways}
              avoidTolls={avoidTolls}
              setAvoidTolls={setAvoidTolls}
            />
          )}

          <MapComponent
            origin={origin}
            destination={destination}
            directions={directions}
            setDirections={setDirections}
            requestDirections={requestDirections}
            setRequestDirections={setRequestDirections}
            fromLocation={fromLocation}
            avoidFerries={avoidFerries}
            avoidHighways={avoidHighways}
            avoidTolls={avoidTolls}
          />
        </LoadScript>
      </div>
    </>
  );
}

export default ReFuel;
