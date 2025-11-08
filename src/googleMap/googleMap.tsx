import {
  GoogleMap,
  DirectionsService,
  DirectionsRenderer,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import "./map.css";

const initialCenter = {
  lat: 47.497913,
  lng: 19.040236,
};

type Props = {
  origin: string;
  destination: string;
  fromLocation: { lat?: number; lng?: number };
  directions: google.maps.DirectionsResult | null;
  setDirections: (d: google.maps.DirectionsResult | null) => void;
  requestDirections: boolean;
  setRequestDirections: (r: boolean) => void;
  avoidFerries: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
};

function MapComponent({
  origin,
  destination,
  directions,
  setDirections,
  requestDirections,
  setRequestDirections,
  fromLocation,
  avoidFerries,
  avoidHighways,
  avoidTolls,
}: Props) {
  const [center, setCenter] = useState(initialCenter);

  useEffect(() => {
    if (fromLocation.lat !== undefined && fromLocation.lng !== undefined) {
      setCenter({
        lat: fromLocation.lat,
        lng: fromLocation.lng,
      });
    }
  }, [fromLocation.lat, fromLocation.lng]);

  useEffect(() => {
    if (directions) {
      setTimeout(() => {
        document
          .querySelectorAll(".gm-style-iw .gm-ui-hover-effect")
          .forEach((btn) => {
            (btn as HTMLElement).style.display = "none";
          });
      }, 80);
    }
  }, [directions]);

  function getMidStepInfo(directions: google.maps.DirectionsResult | null) {
    if (!directions) return null;
    const overviewPath = directions.routes[0]?.overview_path;
    if (!overviewPath || overviewPath.length === 0) return null;
    const midIndex = Math.floor(overviewPath.length / 2);
    const midLatLng = overviewPath[midIndex];
    // összesített távolság/idő az első leg szerint:
    const leg = directions.routes[0].legs[0];
    return {
      position: {
        lat: midLatLng.lat(),
        lng: midLatLng.lng(),
      },
      distance: leg.distance?.text ?? "-",
      duration: leg.duration?.text ?? "-",
    };
  }

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={center}
      zoom={15}
      options={{
        gestureHandling: "greedy",
      }}
    >
      {requestDirections && (
        <DirectionsService
          options={{
            origin,
            destination,
            travelMode: "DRIVING" as google.maps.TravelMode,
            avoidFerries: avoidFerries,
            avoidHighways: avoidHighways,
            avoidTolls: avoidTolls,
          }}
          callback={(
            result: google.maps.DirectionsResult | null,
            status: google.maps.DirectionsStatus
          ) => {
            if (result && status === "OK") {
              console.log(result);
              setDirections(result);
              setRequestDirections(false);
            }
          }}
        />
      )}
      {fromLocation.lat !== undefined && fromLocation.lng !== undefined && (
        <Marker position={{ lat: fromLocation.lat, lng: fromLocation.lng }} />
      )}

      {directions && <DirectionsRenderer directions={directions} />}
      {directions &&
        (() => {
          const midStep = getMidStepInfo(directions);
          if (!midStep) return null;
          return (
            <InfoWindow position={midStep.position}>
              <div style={{ color: "black" }}>
                <strong>
                  {midStep.duration}
                  <br />
                  {midStep.distance}
                </strong>
              </div>
            </InfoWindow>
          );
        })()}
    </GoogleMap>
  );
}

export default MapComponent;
