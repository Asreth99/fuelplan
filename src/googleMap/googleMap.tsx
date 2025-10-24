
import { GoogleMap, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 47.497913,
  lng: 19.040236,
};

type Props = {
    origin: string;
    destination: string;
    directions: google.maps.DirectionsResult | null;
    setDirections: (d: google.maps.DirectionsResult | null) => void;
    requestDirections: boolean;
    setRequestDirections: (r: boolean) => void;
};

function MapComponent({origin, destination, directions, setDirections, requestDirections, setRequestDirections}: Props) {
  return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
        >
        {requestDirections && (
          <DirectionsService
            options={{
              origin,
              destination,
              travelMode: "DRIVING" as google.maps.TravelMode
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
        {directions && <DirectionsRenderer directions={directions} />}     
      </GoogleMap>
  );
}

export default MapComponent;