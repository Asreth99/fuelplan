import "./style.css";
import { useState } from "react";
import SideBar from "./sidebar/sidebar";
import MapComponent from "./googleMap/googleMap";
import { LoadScript } from "@react-google-maps/api";
import Loading from "./loading/loading";

function ReFuel() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [requestDirections, setRequestDirections] = useState(false);
  const [fromLocation, setFromLocation] = useState<{lat?: number;lng?: number;}>({});
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);

  const handleSubmit = () => {
    setRequestDirections(true);
  };

  if (fromLocation.lat && fromLocation.lng) {
    console.log("Origin Location:", fromLocation.lat, fromLocation.lng);
  }

  return (
    <>
      <div style={{ position: "relative", display: "flex", height: "100vh" }}>
        <LoadScript
          googleMapsApiKey="AIzaSyAi17AEaHewcvBOByq2cZo7Pe8XJOcRlq4"
          loadingElement={<Loading/>}
          libraries={["places"]}
        >
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
